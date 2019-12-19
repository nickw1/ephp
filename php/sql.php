<?php

// SQL parser
// takes an sql statement and executes it - as long as it's safe

require('SqlChecker.php');

header("Content-Type: application/json");

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
    $conn = new PDO("mysql:host=localhost;dbname=ephp001", "ephp001", "huneecoh");
    $result = $conn->query($checkedSql);
    $errInfo = $conn->errorInfo();
    if($errInfo[0] == "00000") {
        echo json_encode(["sql"=>$checkedSql, "results"=>$result->fetchAll(PDO::FETCH_ASSOC)]);
    } else {
        echo json_encode(["sqlError"=>$errInfo]);
    }
}
?>
