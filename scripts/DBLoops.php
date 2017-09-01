<?php

class DBLoops {
    private $loops, $results;

    public function __construct(&$loops=[]) {
        $this->loops = $loops;
    }

    public function getMatchingLoop($lineno) {
        return $this->doGetMatchingLoop($this->loops, $lineno);
    }

    protected function doGetMatchingLoop($loops, $lineno) {
        $match = false;

        foreach($loops as $resultvar=>$details) {
            if($lineno>=$details['startLine'] && $lineno<=$details['endLine']) {
                $match = $this->doGetMatchingLoop($details['loops'], $lineno);    
                if($match===false) {
                    $match = $loops[$resultvar];
                    $match["resultvar"] = $resultvar;
                }
            }
        }
        return $match;
    }

    public function addLoop($loop) {
        $this->loops = array_merge($this->loops, $loop);
    }

    public function setLastId($resultvar, $lastId) {
        if($this->loops[$resultvar]) {
            $this->loops[$resultvar]["lastId"] = $lastId;
        }
    }

    public function getLastId($resultvar) {
        return $this->loops[$resultvar] && 
            isset($this->loops[$resultvar]["lastId"]) ?  
            $this->loops[$resultvar]["lastId"] : false;
    }

    public function display() {
        print_r($this->loops);
    }

    public function setResults($resultvar, $results) {
        if(isset($this->loops[$resultvar])) {
            $this->loops[$resultvar]["results"] = $results;
        }
    }

    public function getResults($resultvar) {
        return isset($this->loops[$resultvar]) && 
                isset($this->loops[$resultvar]["results"]) ? 
                $this->loops[$resultvar]["results"] : false;
    }
}

?>
