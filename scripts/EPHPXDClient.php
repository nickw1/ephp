<?php 
require_once('../defines.php');
require_once(XDCLIENT_DIR.'/VarWatcher.php');
require('DBLoopFinder.php');
require('DBLoops.php');
require_once('dbpass.php');

// xdebug client - version 3

//class EPHPXDClient extends VarWatcherXDClient {
// 281117 combined onInit() and handleIdeKeyOnInit() for easier initialising
// of database/source stuff for a given IDE key (user)
class EPHPXDClient extends XDClient\VarWatcher  {
    protected  $lineno, $curLine, $loops, $dbconn, $lf, $user, $sqlqueries;
    protected $startTime;

    public function __construct(MultiUserEmitter $emitter) {

        parent::__construct($emitter);
        $this->curLine = [];
        $this->sqlqueries = [];
        $this->startTime = time();
        fwrite($this->log, 
            "EPHPXDClient started: start time = {$this->startTime}\n\n");
    }

    public function onInit($doc) {
        parent::onInit($doc);
        $ok = false;
        $idekey = (string)$doc["idekey"];
        fwrite($this->log,  "onInit(): IDE key=$idekey\n\n");
        if($doc["fileuri"]) {
            $this->lf[$idekey] = new DBLoopFinder((string)$doc["fileuri"]);
            if($this->lf[$idekey]) {
                $loginCredentials = $this->lf[$idekey]->getLoginCredentials();
                if($loginCredentials["username"]==$idekey) {
                    $this->dbconn[$idekey] = new PDO
                        ($loginCredentials["connstring"],
                        $loginCredentials["username"],
                        $loginCredentials["password"]);
                    $this->emitter->setUser($idekey);
                    $ok = $idekey; 
                } elseif($loginCredentials===false) {
                    $this->emitter->setUser($idekey);
                    $ok = $idekey; 
                }
                if($ok) {
                    $this->loops[$idekey] = new DBLoops();
                } else {
                    unset($this->lf[$idekey]);
                }
               }
        }
        return $ok;
    }

    public function handleObject($n, $prop) {
        parent::handleObject($n, $prop);
        switch($prop["classname"]) {
                case "PDOStatement":
                    if ($this->dbconn[$this->idekey]!==false && 
                        $prop["children"]==1) {
                        $sql = base64_decode($prop->property);
                        $n1 = str_replace('$','',$n);
                    
                        if($this->lf[$this->idekey]) {
                            $results = false;
                            if(!isset($this->vars[$this->idekey][$n])) {
                                $this->vars[$this->idekey][$n] = 
                                    ["type"=>"query", "value"=>$sql];
                            }
//                            fwrite($this->log,"vars index $n = \n\n");
 //                           fwrite($this->log, print_r($this->vars[$this->idekey][$n], true));
                            // get the db results for this query if it's
                            // not already been done
                            if (!isset($this->vars
                                    [$this->idekey][$n]["dbresults"])) {
                                fwrite($this->log,  
                                    "DBResults not set for {$this->idekey} ".
                                    "n1...\n\n");
                                $loop=$this->lf[$this->idekey]->getLoops([$n1]);
                                if($loop!==false) {
                                    fwrite($this->log, 
                                        "Setting DBResults for {$this->idekey}".
                                        " variable $n1\n\n");
                                    $this->loops[$this->idekey]->addLoop($loop);
                                    $results = $this->executeSQL($sql); 
                                    if($results[0]!==false) {
                                        $this->loops[$this->idekey]->setResults
                                        ($n1, $results[0]);
                                        $this->vars[$this->idekey][$n]
                                            ["dbresults"]= $results;    
                                        $this->emitter->emit
                                       (["cmd"=>"dbresults","data"=>
                                       ["varName"=>$n1,"results"=>$results[0]]]);
                                    } else {
                                        fwrite($this->log, "ERROR INFO: ");
                                        fwrite($this->log, print_r($results[1],
                                             true));
                                    }
                                }
                            } else {
                                $results = $this->vars
                                    [$this->idekey][$n]["dbresults"];
                                fwrite($this->log, 
                                    "Using previous results for ".
                                    "{$this->idekey} $n1:\n\n");
                            }
                        }
                    }
                
                 break;

            case "PDO":    
                if(!isset($this->sqlqueries[$this->idekey])) {
                    $var = str_replace('$','',$n);
                    $this->sqlqueries[$this->idekey]=
                        $this->lf[$this->idekey]->getSQLQueries($var);
                }
                break;
        }
    }

    public function handleArray($n, $prop) {
        parent::handleArray($n, $prop);
        $loop = $this->loops[$this->idekey]->getMatchingLoop($this->lineno);
        $n1 = str_replace('$','',$n);
        // if the loop's rowvar matches this variable...
        if($loop!==false && $loop["rowvar"]== $n1) {
            $row = $this->vars[$this->idekey][$n]["value"];    
                        
            // find the row's id if it has one
            $id = isset($row["id"]) ?  $row["id"]:
                (isset($row["ID"]) ? $row["ID"]:false);

            // if the id is different to last time we fetched the
            // row for this loop, report it
            if($id!==false && $id != $this->loops[$this->idekey]->getLastId
                    ($loop["resultvar"])) {
                $this->emitter->emit(["cmd"=>"newrow", "data"=>$id]);
                $this->loops[$this->idekey]->setLastId($loop["resultvar"], $id);
            }
        }
    }


    protected function executeSQL($sql) {
        if($this->dbconn[$this->idekey]!==false) {
            $result = $this->dbconn[$this->idekey]->query($sql);
            return [$result ? $result->fetchAll(PDO::FETCH_ASSOC) : false,
                        $this->dbconn[$this->idekey]->errorInfo()];
        }
        return false;
    }

    // allows each socket connection (now associated with an idekey) to
    // emit messages relating to that socket connection's user (idekey)
    public function handleIdeKeyOnSockChange($idekey) {
        parent::handleIdeKeyOnSockChange($idekey);
        $this->emitter->setUser($idekey);
    }

    public function onLineNo($conn, $lineno) {
        // See if there is an SQL query on this line, execute it to catch
        // errors; testing for a PDOStatement in the normal debugging flow
        // will not work as false is returned on error

        // TODO think we are executing sql queries twice (also during
        // regular debugging stepthrough( which we don't want to do
        if(isset($this->sqlqueries[$this->idekey]) && 
                $this->sqlqueries[$this->idekey]!==false) {
            foreach($this->sqlqueries[$this->idekey] as $sqlquery) {
                if($sqlquery["startLine"]==$lineno) {
                    $executableQuery = $this->replaceQueryVariables 
                        ($sqlquery["query"]);
                    $result = $this->dbconn[$this->idekey]->query
                        ($executableQuery);
                    $errorInfo = $this->dbconn[$this->idekey]->errorInfo();
                    if($errorInfo[0]!="00000") {
                        // emit sql error
                        $this->emitter->emit
                               (["cmd"=>"dberror","data"=>
                                       ["lineno"=>$lineno,
                                        "query"=>$executableQuery,
                                        "rawcodequery"=>$sqlquery,
                                        "msg"=>$errorInfo[2]]]);
                        // stop debugger will happen automatically
                        // but with a horrible error, so do it here!
                        $this->forcedShutdown = true;
                        $this->shutdown($conn);
                    } 
                    break;
                }
            }
        }
    }

    public function replaceQueryVariables($query) {
        $executableQuery = $query;
        foreach($this->vars[$this->idekey] as $k=>$v) {
            $executableQuery = str_replace($k, $v["value"], $executableQuery);
        }
        return $executableQuery;
    }
 
    // Must be run when a debug session finishes - we do not want
    // this stuff hanging around
    public function onStop($idekey) {
        parent::onStop($idekey);
        $this->dbconn[$idekey] = null;
        $this->loops[$idekey] = null;
        $this->lf[$idekey] = null;
        unset($this->sqlqueries[$idekey]);
    }
}

?>

        
