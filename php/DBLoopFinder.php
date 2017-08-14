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
