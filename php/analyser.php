<?php

// INPUT: php script which can have query string or post data

class InputVars {
    private $varlist, $get, $post, $srcGets, $srcPosts;

    public function __construct($get, $post) {
        //$this->varlist = [];
        $this->varlist = array();
        $this->get = $get;
        $this->post = $post;
        $this->srcGets= $this->srcPosts=0;
    }

    public function addVar($phpvar, $reqtype, $httpvar, $linenum) {
//        $this->varlist[$phpvar] = [ "reqtype" => $reqtype, "httpvar" => $httpvar ];
        $this->varlist[$phpvar] = array( "reqtype" => $reqtype,
                                    "httpvar" => $httpvar,
                                    "lineNumber" => $linenum );

        if($reqtype=="GET") $this->srcGets++;
        if($reqtype=="POST") $this->srcPosts++;
    }

    public function getValue($phpvar) {
        if(isset($this->varlist[$phpvar])) {
            return $this->varlist[$phpvar]["reqtype"]=="POST" ?
                $this->post[$this->varlist[$phpvar]["httpvar"]]:
                $this->get[$this->varlist[$phpvar]["httpvar"]];
        }
    }

    public function getVarsAndValues() {
        $arr = array();
        foreach($this->varlist as $var=>$value) {
            $arr[] = array ("variable"=>$var,"value"=>$this->getValue($var),
                            "httpVar"=>$this->varlist[$var]["httpvar"],
                            "lineNumber"=>
                                $this->varlist[$var]["lineNumber"]);
        }
        return $arr;
    }

    public function nPosts() {
        return $this->srcPosts; 
    }

    public function  nGets() {
        return $this->srcGets; 
    }
}

class DBQuery {
    private $dbq, $conn, $sql, $lineNumber;

    public function __construct() {
//        $this->dbq = [];
        $this->dbq = array();
    }

    public function setLineNumber($lineNumber) {
        $this->lineNumber = $lineNumber;
    }

    public function getLineNumber() {
        return $this->lineNumber;
    }

    public function addPart($part) {
        $this->dbq[] = $part;
    }

    // means we can make the SQL just once and have it available to us
    public function makeSQL() {
        if(! $this->sql) {
            $this->sql = $this->getSQL();    
        }
    }
    public function getSQL() {
        return $this->doGetSQL("value");
    }

    public function getSQLWithVars() {
        return $this->doGetSQL("var");
    }


    private function doGetSQL($type) {
        $sql = "";
        foreach($this->dbq as $part) {
            if(is_array($part)) {
                if(isset($part[$type])) {
                    $sql .= strtolower($part[$type]);
                }
            } else { 
                $sql .= strtolower($part);
            }
        }
        return $sql;
    }

    public function execute($conn) {
        $this->makeSQL();
        return $conn->query($this->sql);
    }

	// Hacky way of trying out inserts and updates without running them
	// Prepare the statement without executing and then test whether
	// it worked
	// the setAttribute() is necessary to get error info after doing
	// the prepare
	
    public function test($conn) {
	$conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        $this->makeSQL();
         $conn->prepare($this->sql);
    }

    public function isSelect() {
        $this->makeSQL();
        return strncmp($this->sql, "select", 6) == 0;
    }

    public function isInsert() {
        $this->makeSQL();
        return strncmp($this->sql, "insert", 6) == 0;
    }

    public function isUpdate() {
        $this->makeSQL();
        return strncmp($this->sql, "update", 6) == 0;
    }

    public function isDelete() {
        $this->makeSQL();
        return strncmp($this->sql, "delete", 6) == 0;
    }
}


class TokenReader {
    private $tokens, $index;

    public function __construct($contents) {
        $tokensTmp = token_get_all($contents);
//        $this->tokens = [];
        $this->tokens = array();
        foreach ($tokensTmp as $tok) {
            if(!(is_array($tok) && 
                ($tok[0] == T_WHITESPACE || $tok[0] == T_COMMENT))) {
                $this->tokens[] = $tok;
            }
        }
        $this->index=0;
    }

    public function forward($n=1) {
        $ntokens=count($this->tokens);
        $this->index = ($this->index + $n < $ntokens) ?
            $this->index+$n : $ntokens-1; 
        //print_token($this->tokens[$this->index],$this->index);
    }

    public function findInputVars($reqtype) {
//        echo token_name($this->tokens[$this->index][0])."<br />";

        if($this->index <= count($this->tokens)-6 &&
            $this->isVarAssignment() &&
            is_array($this->tokens[$this->index+2]) &&
            $this->tokens[$this->index+2][0] == T_VARIABLE &&
    //        $this->tokens[$this->index+2][1] == '$_'.$reqtype &&
            ($this->tokens[$this->index+2][1] == '$_GET' ||    
            $this->tokens[$this->index+2][1] == '$_POST') &&
            $this->tokens[$this->index+3] == "[" &&
            $this->tokens[$this->index+5] == "]" &&
            is_array($this->tokens[$this->index+4]) &&
            $this->tokens[$this->index+4][0] == T_CONSTANT_ENCAPSED_STRING) {
            $arr = array ($this->tokens[$this->index][1] , 
                            substr($this->tokens[$this->index+2][1], 2),
                            str_replace('"','',
                            $this->tokens[$this->index+4][1]),
                                $this->tokens[$this->index][2]);
            return  array($arr, 6);
        }
        return null;
    }

    public function atEnd() {
        return $this->index == count($this->tokens)-1;
    }

    public function fromEnd($n) {
        return $this->index > count($this->tokens)-$n;
    }
 
    public function reset() {
        $this->index = 0;
    }

    public function isVarAssignment() { 
            return is_array($this->tokens[$this->index])&&
            $this->tokens[$this->index][0] == T_VARIABLE &&
            $this->tokens[$this->index+1] == "=";
    }

    public function findPdoInfo() {
        if($this->index <= count($this->tokens)-10 &&
            $this->isVarAssignment() &&
            is_array($this->tokens[$this->index+2]) &&
            $this->tokens[$this->index+2][0] == T_NEW &&
            is_array($this->tokens[$this->index+3]) &&
            $this->tokens[$this->index+3][0] == T_STRING &&
            $this->tokens[$this->index+3][1]=="PDO" &&
            $this->tokens[$this->index+4]=="(" &&
            is_array($this->tokens[$this->index+5]) &&
            $this->tokens[$this->index+5][0] == T_CONSTANT_ENCAPSED_STRING &&
            $this->tokens[$this->index+6]=="," &&
            is_array($this->tokens[$this->index+7]) &&
            $this->tokens[$this->index+7][0] == T_CONSTANT_ENCAPSED_STRING &&
            $this->tokens[$this->index+8]=="," &&
            is_array($this->tokens[$this->index+9]) &&
            $this->tokens[$this->index+9][0] == T_CONSTANT_ENCAPSED_STRING){

            // mysql:host=localhost;dbname=dftitutorials
            $host = null;
            $dbname = null;
            $conninfo =  explode(":",$this->tokens[$this->index+5][1]);
            if(count($conninfo)==2) {
                $keyvals = explode(";", $conninfo[1]);
                foreach ($keyvals as $keyval) {
                    $kv_array = explode("=", $keyval);
                    if(count($kv_array)==2) {
                        switch($kv_array[0]) {
                            case "host":
                                $host = $kv_array[1];
                                break;
                            case "dbname":
                                $dbname = $kv_array[1];
                                break;
                        }
                    }
                }    
            }
            return array(
                        array($this->tokens[$this->index][1],
                            str_replace('"','',
                                $this->tokens[$this->index+7][1]),
                            str_replace('"','',
                                $this->tokens[$this->index+9][1]),
                            $host, $dbname), 
                        10);
        }
        return null;
    }

    public function getSQLLoop($resultvars) {
        $i = $this->index;
        $result = $loop = $matched_resultvar = null;
        if($this->index <= count($this->tokens)-11 &&
            is_array($this->tokens[$this->index]) &&
            $this->tokens[$this->index][0]==T_WHILE &&
            $this->tokens[$this->index+1]=="(" &&
            is_array($this->tokens[$this->index+2]) &&
            $this->tokens[$this->index+2][0]==T_VARIABLE &&
            $this->tokens[$this->index+3]=="=" &&
            is_array($this->tokens[$this->index+4]) &&
            $this->tokens[$this->index+4][0]==T_VARIABLE &&
            in_array($this->tokens[$this->index+4][1], $resultvars) &&
            is_array($this->tokens[$this->index+5]) &&
            $this->tokens[$this->index+5][0]==T_OBJECT_OPERATOR &&
            is_array($this->tokens[$this->index+6]) &&
            $this->tokens[$this->index+6][0]==T_STRING &&
            $this->tokens[$this->index+6][1] == "fetch" &&
            $this->tokens[$this->index+7]=="(" &&
            $this->tokens[$this->index+8]==")" &&
            $this->tokens[$this->index+9]==")") {

            $i = $this->index+11;
            $loop = array();
            $loop["start"] = $this->tokens[$this->index][2];
            $loop["vars"] = array();
            $loop["rowvar"] = $this->tokens[$this->index+2][1];
            $nesting=0;
            $matched_resultvar = $this->tokens[$this->index+4][1];
            $rowecho=array();

            while($i<count($this->tokens)&&
                ($this->tokens[$i]!="}" || $nesting>0)) {
//                echo "IN LOOP: $nesting ";
//                print_token($this->tokens[$i], $i);
                if(is_array($this->tokens[$i])) {
                    
                    $loop["end"] = $this->tokens[$i][2];
                    if($this->tokens[$i][0]==T_VARIABLE &&
                        $this->tokens[$i][1]==$loop["rowvar"] &&
                        $this->tokens[$i+1]=="[" &&
                        is_array($this->tokens[$i+2]) &&
                        ($this->tokens[$i+2][0]==T_STRING ||
                        $this->tokens[$i+2][0]==T_CONSTANT_ENCAPSED_STRING) &&
                        $this->tokens[$i+3]="]") {
                        //echo "Found rowvar\n";
                        $loop["vars"][] = array ("lineNumber"=>
                            $this->tokens[$i][2], "value"=>
                            str_replace('"','',$this->tokens[$i+2][1]));
                        
                    }
                } elseif ($this->tokens[$i]=="{") {
                    //echo "Found a {\n";
                    $nesting++;
                } elseif($this->tokens[$i]=="}" && $nesting>0) {
                    //echo "Found a }\n";
                    $nesting--;
                }
                $i++;
            }
        }

        return $loop!=null ? 
            array(array("resultvar"=>$matched_resultvar,
                        "loop"=>$loop),
                        $i-$this->index) : null;
    }
            
    public function getSQLQuery($pdovar, $vars) {
	$resultvar = null;
        $i = $this->index;
        $query = null; 
        if(
//            is_array($this->tokens[$this->index]) &&
 //           $this->tokens[$this->index][0] == T_VARIABLE &&
  //          $this->tokens[$this->index+1] == "=" &&
            is_array($this->tokens[$this->index]) &&
            $this->tokens[$this->index][0] == T_VARIABLE &&
            $this->tokens[$this->index][1] == $pdovar &&
            is_array($this->tokens[$this->index+1]) &&
            $this->tokens[$this->index+1][0] == T_OBJECT_OPERATOR &&
            is_array($this->tokens[$this->index+2]) &&
            $this->tokens[$this->index+2][0] == T_STRING &&
            $this->tokens[$this->index+2][1] == "query" &&
            $this->tokens[$this->index+3] == "(" ) {

            $resultvar = $this->tokens[$this->index][1]; 
            $i += 4;
            $query = new DBQuery();
            $query->setLineNumber($this->tokens[$this->index][2]);

	    if( $this->index >= 2 &&
            	is_array($this->tokens[$this->index-2]) &&
           	$this->tokens[$this->index-2][0] == T_VARIABLE &&
           	$this->tokens[$this->index-1] == "=") 	{
            	$resultvar = $this->tokens[$this->index][1];
	    }

            while($this->tokens[$i] != ")" && $i<count($this->tokens)) {
                if(is_array($this->tokens[$i])) {
                    switch($this->tokens[$i][0]) {
                        case T_ENCAPSED_AND_WHITESPACE:
                            $query->addPart($this->tokens[$i][1]); 
                                break; 
                        case T_CONSTANT_ENCAPSED_STRING:
                            $query->addPart(str_replace('"','',
                                $this->tokens[$i][1]));
                            break;

                        case T_VARIABLE:
                            /*
                            $query-> addPart( [ "var" => 
                                $this->tokens[$this->index][1],
                                "value" => $vars->getValue
                                    ($this->tokens[$this->index][1])]);
                            */
                            $query-> addPart( array( "var" => 
                                $this->tokens[$i][1],
                                "value" => $vars->getValue
                                    ($this->tokens[$i][1])));
                            break;
                    }
                }
                $i++;
            }
            $i++; // move beyond the closing ) of the query call 
            // return [$query, $i-$this->index];
	
           $a = array (array("query"=>$query,
                    "resultvar"=>$resultvar), $i - $this->index);
	return $a;
        }    
        return null;
    }
}

session_start();
header("Content-type: application/json");

$config = json_decode(file_get_contents("../config.json"), true);
$errors = array();

$get = array();
$post = array();

$target = $_SERVER["REQUEST_METHOD"]=="POST" ? $_POST["target"]:$_GET["target"];

foreach($_GET as $k=>$v) {
    if($k!="target") {
        $get[$k] = $v;
    }
}
foreach($_POST as $k=>$v) {
    if($k!="target") {
        $post[$k] = $v;
    }
}


$httpCode = 500;
$sqlresults = array();
$resultvars = array();
$warnings = array();

$loop=null;

if(!isset($_SESSION["ephpuser"])) {
    $errors[] = "Not logged in.";
}
elseif(($fileinfo=get_php_file($target,$config["ephproot"]))==null) {
    $errors[] = "Can only read from ephp-designated directories.";
} else {
    $vars =new InputVars($get, $post);
    list($expectedUsername, $targetfile) = $fileinfo;
    if($expectedUsername != $_SESSION["ephpuser"]) {
        $errors[] = "Cannot read another user's files.";
        $httpCode = 400;
    } else {
        $execurl = "$target?".http_build_query($get);

        $url = "http://".$_SERVER["SERVER_NAME"]."/$execurl";
        if(($script_result = @get_contents($url, $_SERVER["REQUEST_METHOD"],
                                                $post)) ===false) {
            $errors[] = "HTTP request for file on server failed.";

        } elseif(preg_match("/<b>Parse error<\/b>:  syntax error, (.*) in .* on line <b>(\d+)<\/b>/", $script_result["content"], $matches)) { 
            $errors[] = array ("syntaxError" => 
                            array ("reason"=>$matches[1],
                                "lineNumber"=>$matches[2])
                        );
            $httpCode = 200; // still made successful request
        } elseif($script_result["status"]["code"]==200) {
            if(($target_contents = @file_get_contents($targetfile))===false) {
                $errors[] = 
                    "Cannot open specified PHP file on server $targetfile.";
                $httpCode = 404;
            } else {
                $tok = new TokenReader($target_contents);

                $execurl = "$target?".http_build_query($get);

                $url = "http://".$_SERVER["SERVER_NAME"]."/$execurl";
                $pdovar = null;
                $queries = array();

                $username=null;
                $host=null;
                $dbname=null;

                while(! $tok->atEnd()) {
                    $result = $tok->findInputVars($_SERVER["REQUEST_METHOD"]);
                    if($result!==null) {
                        $vars->addVar($result[0][0],$result[0][1],$result[0][2],
                                    $result[0][3]);
                        $tok->forward($result[1]);
                    } else {
                        $result = $tok->findPdoInfo();
                        if($result!==null) {
                            $pdovar = $result[0][0];
                            $username = $result[0][1];
                            $password = $result[0][2];
                            $host = $result[0][3];
                            $dbname = $result[0][4];
                            $tok->forward($result[1]);
                        } elseif($pdovar!=null &&
                                ($result = $tok->getSQLQuery($pdovar, $vars)) 
                                != null) {
		    	    if($result[0]["resultvar"]!=null) {
                            	$resultvars[] = $result[0]["resultvar"];
                            	$queries[$result[0]["resultvar"]] = $result[0];
			    } else {
				$queries[] = $result[0];
			    }
                            $tok->forward($result[1]);
                        } elseif(($result=$tok->getSQLLoop($resultvars))!=null){
                            $queries[$result[0]["resultvar"]]["loop"] = 
                                $result[0]["loop"];
                            $tok->forward($result[1]);
                        } else { 
                            $tok->forward(1);
                        }
                    }
                }
                if(($_SERVER["REQUEST_METHOD"]=="POST" && $vars->nPosts()==0) ||
                    ($_SERVER["REQUEST_METHOD"]=="GET" && $vars->nGets()==0)) {
                    $warnings[] = "Method was $_SERVER[REQUEST_METHOD] but no ".
                            '$_'.$_SERVER["REQUEST_METHOD"]." variables found.";
                }
                if($username != null) {

                    if($username != $expectedUsername) { 
                        $errors[]="Cannot connect to another user's database.";
                    } elseif($host && $dbname) {
                        try {
                            $conn= 
                                new PDO("mysql:host=$host;dbname=$dbname",
                                $username,$password);

                            foreach($queries as $query) { 
                                if($query["query"]->isSelect()) {
                                    $sql = $query["query"]->getSQL();
                                    $sqlWithVars = 
                                        $query["query"]->getSQLWithVars();
                                    $curResults = array();
                                    $result = $query["query"]->execute($conn);
                                    if($result===false) {
                                        $sqlerr = $conn->errorInfo();
                                        $errors[] = array 
                                            ("sqlError" => array
                                        ("query"=> $sql, "error"=>$sqlerr[2],
                                        "lineNumber"=>$query["query"]->
                                            getLineNumber())
                                        );
                                    } else {
                                        while($row=$result->fetch
                                        (PDO::FETCH_ASSOC)) {
                                        $curResults[] = $row;
                                        }
                                        $sqlresults[]=array 
                                            ("sql" => $sqlWithVars, 
                                            "variable"=>$query["resultvar"],
                                            "loop"=>$query["loop"],
                                            "lineNumber"=>$query["query"]->
                                                getLineNumber(),
                                                "results" => $curResults);
                                    }
                                } else {
				    $sql = $query["query"]->getSQL();
				    $query["query"]->test($conn);
			            $sqlerr = $conn->errorInfo();
				    if($sqlerr[0] != 0 ) {
                                        $errors[] = array 
                                            ("sqlError" => array
                                        ("query"=> $sql, "error"=>$sqlerr[2],
                                        "lineNumber"=>$query["query"]->
                                            getLineNumber())
                                        );
				    }
				}
				
                            }
                        } catch (PDOException $e) {
                            $errors[] = "Cannot connect to database with ".
                                "username and password in target PHP file."; 
                        }
                    } else {
                        $errors[] = "Host and/or database name missing from ".
                                    "PDO connection.";
                    }
                } 
            } 
        } 
    } 
} 

if(empty($errors)) {
    $json = array (
        //"php" => htmlentities($target_contents), 
        "php" => $target_contents, 
        "response" => $script_result,
        "vars" => $vars ? $vars->getVarsAndValues(): array(),
        "sqlqueries" => $sqlresults,
        "warnings"=> $warnings,
                ); 
        $httpCode = $script_result["status"]["code"];
} else { 
    $json = array ("errors" => $errors);
}


header("HTTP/1.1 $httpCode");
echo json_encode($json);

        

function print_token($tok, $i)
{
    echo "#$i: ";
    if(is_array($tok))
    {
        if($tok[0] != T_WHITESPACE)
            echo "line $tok[2]" . ": " . token_name($tok[0])." : ". 
                htmlentities($tok[1]) . "\n";
    }
    else 
        echo htmlentities($tok)."\n";
}

function get_php_file($target, $ephproot)
{
    $matches=array();
    // can only get php files from specific ephp directories (sandbox)
    if(preg_match("/^\/~(${ephproot}\d{3})\/([a-zA-Z0-9_\/\-]+\.php)$/", 
        $target,$matches)) {
        return array ($matches[1],"/home/$matches[1]/public_html/$matches[2]");
    }
    return null;
}

// use curl so we can get the headers and use post

function get_contents($targetfile, $method="GET", $postdata=null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetfile);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    if($method=="POST") {
    
        curl_setopt($ch, CURLOPT_POST, 1);
        if($postdata!=null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
        }
    }    
    $result = curl_exec($ch);
    $response = array();
    $lines  = explode("\r\n", $result);
    $count = -2;
    $code = 0;
    while($code < 200 && $count<count($lines)) {
        $count += 2;
        preg_match('/^HTTP\/1\.1 (\d+) (.*)$/',$lines[$count],$matches);
        if(count($matches)<3) {
            return false;
        }
        $code = $matches[1];
    }
    if ($code < 200) {
        return false;
    } else {
        $response["status"]["code"] = $code; 
        $response["status"]["message"] = $matches[2];
        $count+=1;
        while(strlen($lines[$count]) > 0 && $count<count($lines)) {
            $header=null;
            $value=null;
            list($header, $value) = explode(": ", $lines[$count]);
            if($header && $value) {
                $response["headers"][$header] = $value;
            }
            $count++;
        }
    
        $count++;
        while($count < count($lines)) {
            $response["content"] .= $lines[$count++]."\r\n";
            }
    }
    curl_close($ch);
    return $response;
}
?>
