<?php 

require_once('/home/nick/xdclient/VarWatcher.php');
require('DBLoopFinder.php');
require('DBLoops.php');
require_once('dbpass.php');

// xdebug client - version 3

//class EPHPXDClient extends VarWatcherXDClient {
class EPHPXDClient extends XDClient\VarWatcher  {
    protected  $lineno, $curLine, $loops, $dbconn, $lf, $user;
    protected $startTime;

    public function __construct($filename, MultiUserEmitter $emitter) {

        parent::__construct($emitter);
        $this->curLine = [];
        $this->filename = $filename;
        $this->loops = new DBLoops();
        $this->lf = new DBLoopFinder($filename);
        $this->startTime = time();
    }

    public function handleObject($n, $prop) {
        parent::handleObject($n, $prop);
        switch($prop["classname"]) {
                case "PDOStatement":
                    if ($this->dbconn!==false && $prop["children"]==1) {
                        $sql = base64_decode($prop->property);
                        echo "this->vars...\n";
                        print_r($this->vars);
                        $n1 = str_replace('$','',$n);
                        if(!isset($this->vars[$n])) {
                            echo "this->vars(inside isset)...";
                            $this->vars[$n] = ["type"=>"query", "value"=>$sql];
                            print_r($this->vars);
                            $loop=$this->lf->getLoops([$n1]);
                            if($loop!==false) {
                                $this->loops->addLoop($loop);
                                $results = $this->executeSQL($sql); 
                                $this->loops->setResults($n1, $results);
                                $this->emitter->emit
                                    (["cmd"=>"dbresults","data"=>
                                    ["varName"=>$n1,"results"=>$results]]);
                                
                            }
                        }
                    }
                
                 break;
            }
        
    }

    public function handleArray($n, $prop) {
        parent::handleArray($n, $prop);
        $loop = $this->loops->getMatchingLoop($this->lineno);
        $n1 = str_replace('$','',$n);
        // if the loop's rowvar matches this variable...
        if($loop!==false && $loop["rowvar"]== $n1) {
            $row = $this->vars[$n]["value"];    
                        
            // find the row's id if it has one
            $id = isset($row["id"]) ?  $row["id"]:
                (isset($row["ID"]) ? $row["ID"]:false);

            // if the id is different to last time we fetched the
            // row for this loop, report it
            if($id!==false && $id != $this->loops->getLastId
                    ($loop["resultvar"])) {
                $this->emitter->emit(["cmd"=>"newrow", "data"=>$id]);
                $this->loops->setLastId($loop["resultvar"], $id);
            }
        }
    }


    protected function executeSQL($sql) {
        if($this->dbconn!==false) {
            $result = $this->dbconn->query($sql);
            return $result ? $result->fetchAll(PDO::FETCH_ASSOC) : false;
        }
        return false;
    }

    public function handleIdeKey($idekey) {
        $loginCredentials = $this->lf->getLoginCredentials();
        if($loginCredentials["username"]==$idekey) {
            $this->dbconn = new PDO
                    ($loginCredentials["connstring"],
                    $loginCredentials["username"],
                    $loginCredentials["password"]);
            $this->emitter->setUser($idekey);
        }
        return true;
    }
}

?>

        
