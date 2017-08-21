<?php

require('vendor/autoload.php');

use PhpParser\ParserFactory;

class DBLoopFinder {

    private $stmts;
 
    public function __construct($filename) {
        $parser=(new ParserFactory)->create(ParserFactory::PREFER_PHP7);
        $code = file_get_contents($filename);
        $this->stmts = $parser->parse($code);
    }

    
    public function getLoginCredentials() {
        return $this->doGetLoginCredentials($this->stmts);
    }

    public function getLoginCredentialsR() {
        return $this->doGetLoginCredentialsR($this->stmts);
    }

    protected function doGetLoginCredentials($node) {
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

                case 'Stmt_While':
                case 'Stmt_Do':
                    $creds=$this->doGetLoginCredentials($node[$i]->stmts);
                    if($creds!==false) {
                        return $creds;
                    }
                    break;

                case 'Stmt_If':
                    $creds=$this->doGetLoginCredentials($node[$i]->stmts);
                    if($creds!==false) {
                        return $creds;
                    } else {
                        for($j=0; $j<count($node[$i]->elseifs); $j++) {
                            $creds = $this->doGetLoginCredentials
                                ($node[$i]->elseifs[$j]->stmts);
                            if($creds!==false) {
                                return $creds;
                            }
                        }
                        if($node[$i]->else->stmts) {
                            $creds = $this->doGetLoginCredentials
                                ($node[$i]->else->stmts);
                            if($creds!==false) {
                                return $creds;
                            }
                        }
                    }
                    break;

            }
        }
        return false;    
    }

    protected function doGetLoginCredentialsR($node) {
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
                    if(($result=$this->recursiveTraversal
                        ("doGetLoginCredentialsR",$node[$i]))!==false) {
                        return $result;
                        }
                                        
            }
        }
        return false;    
    }
    
    protected function recursiveTraversal($callback, $node, $additional=null) {
            switch($node->getType()) {

                case 'Stmt_While':
                case 'Stmt_Do':
                case 'Stmt_For':
                        $result=$this->$callback($node->stmts,$additional);
                        if($result!==false) {
                            return $result;
                        }
                    
                    break;

                case 'Stmt_If':
                    $result=$this->$callback($node->stmts);
                    if($result!==false) {
                        return $result;
                    } else {
                        for($j=0; $j<count($node->elseifs); $j++) {
                            $result = $this->$callback 
                                ($node->elseifs[$j]->stmts, $additional);
                            if($result!==false) {
                                return $result;
                            }
                        }
                        if($node->else->stmts) {
                            $result = $this->$callback ($node->else->stmts,
                                    $additional);
                            if($result!==false) {
                                return $result;
                            }
                        }
                    }
                    break;
               } 
        
        return false;    
    }
    

    public function getLoops($resultvars) {
        try {
            return $this->doGetLoops($this->stmts, $resultvars); 
        
        } catch(Error $e ) {
            throw $e;
        }
    }


    protected function doGetLoops($node, $resultvars) {
        $loops = [];
        for($i=0; $i<count($node); $i++) {
            if($node[$i]->getType()=="Stmt_While" || $node[$i]->getType()==
                "Stmt_Do") {
                switch($node[$i]->cond->getType()) {
                    case "Expr_Assign":
                        if(in_array($node[$i]->cond->expr->var->name,
                            $resultvars)) {
                        $loop = 
                            [ "rowvar"=>$node[$i]->cond->var->name,
                                "startLine"=>
                                    $node[$i]->getAttributes()['startLine'],
                                "endLine"=>
                                    $node[$i]->getAttributes()['endLine']];
                            $loop["loops"]=
                                $this->doGetLoops($node[$i]->stmts,$resultvars);
                            $loops[$node[$i]->cond->expr->var->name] = $loop;
                        }
                        break;

                    case "Expr_Variable":
                        for($j=0; $j<count($node[$i]->stmts); $j++) {
                            if($node[$i]->stmts[$j]->getType()=="Expr_Assign") {
                                if(in_array
                                    ($node[$i]->stmts[$j]->expr->var->name,
                                    $resultvars) && 
                                    $node[$i]->stmts[$j]->var->name ==
                                    $node[$i]->cond->name) {
                                        $loop= 
                                    [ "rowvar"=>$node[$i]->cond->name,
                                    "startLine"=>
                                        $node[$i]->getAttributes()['startLine'],
                                    "endLine"=>
                                        $node[$i]->getAttributes()['endLine']];
                                    $loop["loops"]=$this->doGetLoops
                                        ($node[$i]->stmts, $resultvars);
                                    $loops
                                        [$node[$i]->stmts[$j]->expr->var->name]
                                         = $loop;
                                }
                            }
                        }
                        break;    
                }
            }
        }
        return $loops;
    }

    public function getLoopsR($resultvars) {
        try {
            return $this->doGetLoopsR($this->stmts, $resultvars); 
        
        } catch(Error $e ) {
            throw $e;
        }
    }

    protected function doGetLoopsR($node, $resultvars) {
        $loops = [];
        for($i=0; $i<count($node); $i++) {
            if($node[$i]->getType()=="Stmt_While" || $node[$i]->getType()==
                "Stmt_Do") {
                switch($node[$i]->cond->getType()) {
                    case "Expr_Assign":
                        if(in_array($node[$i]->cond->expr->var->name,
                            $resultvars)) {
                        $loop = 
                            [ "rowvar"=>$node[$i]->cond->var->name,
                                "startLine"=>
                                    $node[$i]->getAttributes()['startLine'],
                                "endLine"=>
                                   $node[$i]->getAttributes()['endLine']];
							for($j=0; $j<count($node[$i]->stmts); $j++) {
                            	$result=$this->recursiveTraversal
                                    ("doGetLoopsR",
                                    $node[$i]->stmts[$j],$resultvars);
								if($result!==false) {	
									$loops = array_merge($loops,$result);
								}	
							}
                            $loops[$node[$i]->cond->expr->var->name] = $loop;
                        }
                        break;

                    case "Expr_Variable":
                        for($j=0; $j<count($node[$i]->stmts); $j++) {
                            if($node[$i]->stmts[$j]->getType()=="Expr_Assign") {
                                if(in_array
                                    ($node[$i]->stmts[$j]->expr->var->name,
                                    $resultvars) && 
                                    $node[$i]->stmts[$j]->var->name ==
                                    $node[$i]->cond->name) {
                                        $loop= 
                                    [ "rowvar"=>$node[$i]->cond->name,
                                    "startLine"=>
                                        $node[$i]->getAttributes()['startLine'],
                                    "endLine"=>
                                        $node[$i]->getAttributes()['endLine']];
                                    $loops
                                        [$node[$i]->stmts[$j]->expr->var->name]
                                         = $loop;
                                }
                            } else {
                            	$result=$this->recursiveTraversal
                                    ("doGetLoopsR",
                                    $node[$i]->stmts[$j],$resultvars);
								if($result!==false) {	
									$loops = array_merge($loops,$result);
								}	
							}
                        }
                        break;    
                }
            }
        }
        return $loops;
    }
}
?>
