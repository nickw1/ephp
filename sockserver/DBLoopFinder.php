<?php

require('../vendor/autoload.php');
require_once('Recurser.php');

use PhpParser\ParserFactory;

class DBLoopFinder {

    private $stmts, $rec, $loopsRec, $sqlRec, $pp;
 
    public function __construct($filename) {
        $parser=(new ParserFactory)->create(ParserFactory::PREFER_PHP7);
        $code = file_get_contents($filename);
        $this->stmts = $parser->parse($code);
        $this->rec = new Recurser($this, "doGetLoginCredentials");
        $this->sqlRec = new Recurser($this, "doGetSQLQueries");
        $this->httpRec = new Recurser($this, "doGetHTTPData");
        $this->loopsRec = new LoopsRecurser
            ($this, "recurse", $this, "doGetLoops");
        $this->depth=-1;
    }

    
    public function getLoginCredentials() {
        return $this->doGetLoginCredentials($this->stmts);
    }

    public function getSQLQueries($pdovar) {
        $q=$this->doGetSQLQueries($this->stmts, $pdovar);
        return $q;
    }

    public function getHTTPData() {
        return $this->doGetHTTPData($this->stmts);
    }

    public function doGetLoginCredentials($node) {
        for($i=0; $i<count($node); $i++) {
            switch($node[$i]->getType()) {
                case "Expr_Assign":
                if($node[$i]->getType()=="Expr_Assign" &&
                    $node[$i]->expr->getType()=="Expr_New"
                    && $node[$i]->expr->class->parts[0]=="PDO" && 
                    count($node[$i]->expr->args)==3) {
                        return
                         ["connstring" =>
                        $node[$i]->expr->args[0]->value->value,
                            "username" =>
                        $node[$i]->expr->args[1]->value->value,
                            "password" =>
                        $node[$i]->expr->args[2]->value->value
                        ];
                }
                break;

                default:
                    if(($result=$this->rec->recursiveTraversal($node[$i]))
                        !==false) {
                        return $result;
                    }
                                        
            }
        }

      return false;    
    }

    public function doGetSQLQueries($node, $pdovar) {
        $queries = false;
        for($i=0; $i<count($node); $i++) {
            switch($node[$i]->getType()) {
                case "Expr_Assign":
                    if($node[$i]->expr->getType()=="Expr_MethodCall" &&
                        $node[$i]->expr->name=="query" &&
                        $node[$i]->expr->var->name==$pdovar) {
                            if($queries===false) {
                                $queries = [];
                            }
                            if(!$this->pp) {
                                $this->pp=new PhpParser\PrettyPrinter\Standard;
                            }
                            $queries[] = ["query"=>
                                    DBLoopFinder::makeUsableQuery
                                    ($this->pp->prettyPrintExpr($node[$i]->expr
                                        ->args[0]->value)),
                                            "startLine"=>
                                    $node[$i]->expr->var->getAttributes()
                                        ["startLine"],
                                            "endLine"=>
                                    $node[$i]->expr->var->getAttributes()
                                        ["endLine"]];
                    }
                    break;

                default:
                    if(($result=$this->sqlRec->recursiveTraversal($node[$i],
                            $pdovar)) !==false) {
                        $queries =  $queries===false ? $result:
                            array_merge($queries,$result);
                    }
            }
        }
        return $queries;
    }

    public function doGetHTTPData($node) {
        $httpdata = false;
        for($i=0; $i<count($node); $i++) {
            switch($node[$i]->getType()) {
                case "Expr_Assign":
                    if($node[$i]->expr->getType()=="Expr_ArrayDimFetch" &&
                        ($node[$i]->expr->var->name=="_POST" ||
                        $node[$i]->expr->var->name=="_GET") ) {
                        if($httpdata===false) {
                            $httpdata = [];
                        }
                        $httpdata[$node[$i]->var->name] = ['name'=>$node[$i]->expr->dim->value,'lineno'=>$node[$i]->getAttributes()['startLine']];    
                    }
                    break;

                default:
                    if(($result=$this->httpRec->recursiveTraversal
                        ($node[$i]))!==false) {
                        $httpdata = $httpdata===false ? $result:
                            array_merge($httpdata, $result);
                }
            }
        }
        return $httpdata;
    }

    public function getLoops($resultvars) {
        return $this->recurse($this->stmts, $resultvars);
    }

    public function recurse($stmts, $resultvars) {
        $this->depth++;
        try {
            for($i=0; $i<count($stmts); $i++) {
                if(($result=$this->loopsRec->recursiveTraversal
                        ($stmts[$i], $resultvars))!==false) {
                    return $result;
                }    
            }
            return false;
        
        } catch(Error $e ) {
            throw $e;
        }
        $this->depth--;
    }

    public function doGetLoops($whilenode, $resultvars) {
        $loops = false;
                switch($whilenode->cond->getType()) {
                    case "Expr_Assign":
                        if(in_array($whilenode->cond->expr->var->name,
                            $resultvars)) {
                        $loop = 
                            [ "rowvar"=>$whilenode->cond->var->name,
                                "startLine"=>
                                    $whilenode->getAttributes()['startLine'],
                                "endLine"=>
                                   $whilenode->getAttributes()['endLine']];
                            for($j=0; $j<count($whilenode->stmts); $j++) {
                                $result=$this->loopsRec->recursiveTraversal
                                    ($whilenode->stmts[$j],$resultvars);
                                if($result!==false) {
                                    $loops = $loops===false ? $result:
                                        array_merge($loops,$result);
                                }    
                            }
                            $loop["loops"] = [];
                            $loops = $loops===false ? []:$loops;
                            $loops[$whilenode->cond->expr->var->name] = $loop;
                        }
                        break;

                    case "Expr_Variable":
                        for($j=0; $j<count($whilenode->stmts); $j++) {
                            if($whilenode->stmts[$j]->getType()=="Expr_Assign"){
                                if(in_array
                                    ($whilenode->stmts[$j]->expr->var->name,
                                    $resultvars) && 
                                    $whilenode->stmts[$j]->var->name ==
                                    $whilenode->cond->name) {
                                        $loop= 
                                    [ "rowvar"=>$whilenode->cond->name,
                                    "startLine"=>
                                        $whilenode->getAttributes()
                                        ['startLine'],
                                    "endLine"=>
                                        $whilenode->getAttributes()['endLine']];
                                    $loop["loops"] = [];
                                    $loops = $loops===false ? []:$loops;
                                    $loops
                                        [$whilenode->stmts[$j]->expr->var->name]
                                         = $loop;
                                }
                            } else {
                                $result=$this->loopsRec->recursiveTraversal
                                    ( $whilenode->stmts[$j],$resultvars);
                                if($result!==false) {    
                                    $loops = $loops===false ? $result:
                                        array_merge($loops,$result);
                                }    
                            }
                        }
                        break;    
                }
        return $loops;
    } // function

    protected static function makeUsableQuery($q) {
        $inQuotes = false;
        $usableQuery = "";
        for($i=0; $i<strlen($q); $i++) {
            if($q[$i]=="\"" && ($i==0 ||  $q[$i-1]!="\\")) {
                $inQuotes = !$inQuotes;
            } elseif(($inQuotes==false && $q[$i]!="." && !ctype_space($q[$i])) 
                    ||
                    ($inQuotes==true && $q[$i]!="{" && $q[$i]!="}")) {
                $usableQuery .= $q[$i];
            }    
        }
        return $usableQuery;
    }
}

?>
