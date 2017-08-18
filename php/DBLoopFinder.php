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

	/*
	protected function recursiveTraversal($node, $callback) {
			switch($node->getType()) {

				case 'Stmt_While':
				case 'Stmt_Do':
					$creds=$callback($node->stmts);
					if($creds!==false) {
						return $creds;
					}
					break;

				case 'Stmt_If':
					$creds=$callback($node->stmts);
					if($creds!==false) {
						return $creds;
					} else {
						for($j=0; $j<count($node->elseifs); $j++) {
							$creds = $callback
								($node->elseifs[$j]->stmts);
							if($creds!==false) {
								return $creds;
							}
						}
						if($node->else->stmts) {
							$creds = $callback
								($node->else->stmts);
							if($creds!==false) {
								return $creds;
							}
						}
					}
					break;
		}
		return false;	
	}
	*/

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
}
?>
