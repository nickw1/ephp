<?php

session_start();
require_once('../defines.php');

if(isset($_SESSION["ephpuser"])) {
    $conn = new PDO("mysql:host=localhost;dbname=".USER_DB, USER_DB_USER, USER_DB_PASS);

    $stmt = $conn->prepare("SELECT narrative, server_anim, http_anim, db_anim FROM ephpusers WHERE username=?");
    $stmt->execute([$_SESSION["ephpuser"]]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if($row === false) {
        header("HTTP/1.1 404 Not Found");
    } else {
        header("Content-Type: application/json");
        echo json_encode(array_map(
                            function($val) { return $val ? true : false; },
                            $row)
                        );
    }
} else {
    header("HTTP/1.1 401 Unauthorized");
}


?>
