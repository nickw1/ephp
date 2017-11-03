<?php
class Recurser {

    protected $cbObj, $cb;

    public function __construct($co, $cm) {
        $this->cbObj = $co;
        $this->cb = $cm;
    }

    public function recursiveTraversal($node, $additional=null) {
            $result = false;
            switch($node->getType()) {

                case 'Stmt_While':
                case 'Stmt_Do':
                case 'Stmt_For':
                    $result =$this->loopHandler($node, $additional);
                    break;

                case 'Stmt_If':
                    $result = $this->ifHandler($node, $additional);
                    break;

               } 
        
        return $result;    
    }

    public function loopHandler($node, $additional) {
        return $this->cbObj->{$this->cb}($node->stmts, $additional);
    }

    public function ifHandler ($node, $additional) {
        $result=$this->cbObj->{$this->cb}($node->stmts, $additional);
        if($result!==false) {
            return $result;
        } else {
            for($j=0; $j<count($node->elseifs); $j++) {
                $result = $this->cbObj->{$this->cb} 
                    ($node->elseifs[$j]->stmts, $additional);
                if($result!==false) {
                    return $result;
                }
            }
            if($node->else->stmts) {
                $result = $this->cbObj->{$this->cb} 
                    ($node->else->stmts, $additional);
                if($result!==false) {
                    return $result;
                }
            }
			return false;
        }
    }    
}

class LoopsRecurser extends Recurser {

    protected $loopsCbObj, $loopsCb;

    public function __construct($co, $cm, $lco, $lcm) {
        parent::__construct($co, $cm);
        $this->loopsCbObj = $lco;
        $this->loopsCb = $lcm;
    } 

    public function loopHandler($node, $additional) {
        if($node->getType()=='Stmt_While' || $node->getType()=='Stmt_Do') {
            return $this->loopsCbObj->{$this->loopsCb}($node, $additional);
        } else {
            return parent::loopHandler($node, $additional);
        }
    }
}
?>

