<?php

// SQL parser
// takes an sql statement and executes it - as long as it's safe

session_start();
header("Content-Type: application/json");

require('../classes/SqlChecker.php');
require('../classes/DBLoopFinder.php');



if(!isset($_SESSION["ephpuser"])) {
    header("HTTP/1.1 401 Unauthorized");
} 
else
{
    $loopBounds = [];
	$varName = null;
    if(isset($_GET["resultvar"]) && isset($_GET["fileuri"]) && preg_match("/^[\w\d]+$/", $_GET['resultvar'])) {
        $varName = $_GET["resultvar"];
        $loopFinder = new DBLoopFinder($_GET["fileuri"]);
        $loops = $loopFinder->getLoops([$varName]);
        if($loops[$varName] && $loops[$varName]["startLine"] && $loops[$varName]["endLine"]) {
            $loopBounds = ["start"=>$loops[$varName]["startLine"],
                        "end"=>$loops[$varName]["endLine"]];
        }
    }

    $sql = isset($_REQUEST["sql"]) ? $_REQUEST["sql"]: "";
    $sqlChecker = new SqlChecker($sql);
    if(!$sqlChecker->isValid()) {
        header("HTTP/1.1 400 Bad Request");
        echo json_encode(["error"=>"Invalid SQL"]);
    } else if($sqlChecker->potentiallyUnsafe()) {
        header("HTTP/1.1 400 Bad Request");
        echo json_encode(["error"=>"Refusing to execute this SQL statement; it has potentially unsafe characters"]);
    } else if (!$sqlChecker->isSelect()) {
        echo json_encode(["sql" => $sql, "results"=>[]]);
    } else {
        $sqlParts = $sqlChecker->makeSafeSql();
        $checkedSql = implode(" ", $sqlParts);
        $conn = new PDO("mysql:host=localhost;dbname={$_SESSION["ephpuser"]}",  $_SESSION["ephpuser"], $_SESSION["ephppass"]);
        $result = $conn->query($checkedSql);
        $errInfo = $conn->errorInfo();
        if($errInfo[0] == "00000") {
            echo json_encode(["sql"=>$checkedSql, "results"=>$result->fetchAll(PDO::FETCH_ASSOC), "loopBounds"=>$loopBounds, "varName"=>$varName]);
        } else {
            echo json_encode(["sqlError"=>$errInfo]);
        }
    }
}
?>
