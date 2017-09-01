<?php

require('vendor/autoload.php');
require_once('Recurser.php');

use PhpParser\ParserFactory;

class DBLoopFinder {

    private $stmts, $rec, $loopsRec;
 
    public function __construct($filename) {
        $parser=(new ParserFactory)->create(ParserFactory::PREFER_PHP7);
        $code = file_get_contents($filename);
        $this->stmts = $parser->parse($code);
        $this->rec = new Recurser($this, "doGetLoginCredentials");
        $this->loopsRec = new LoopsRecurser($this, "recurse", $this, "doGetLoops");
        $this->depth=-1;
    }

    
    public function getLoginCredentials() {
        return $this->doGetLoginCredentials($this->stmts);
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
}

?>
