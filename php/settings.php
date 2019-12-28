<?php

session_start();
require_once('../defines.php');

if(isset($_SESSION["ephpuser"])) {
    $conn = new PDO("mysql:host=localhost;dbname=".USER_DB, USER_DB_USER, USER_DB_PASS);
    switch($_SERVER["REQUEST_METHOD"]) {
        case "GET":
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
            break;

        case "POST":
            $body = file_get_contents("php://input");
            $newSettings = json_decode($body, true);
            $parts = array_map(
                        function($val) {
                            return "$val=?";
                        },
                        array_keys($newSettings)
                    );
            $dbValues = array_map(
                            function($val) { return $val ? 1:0; },
                            array_values($newSettings)
                        );
            $sql = "UPDATE ephpusers SET ". implode(",", $parts) . " WHERE username=?";
            $stmt = $conn->prepare($sql);
            $stmt->execute(array_merge($dbValues, [$_SESSION["ephpuser"]]));
            break;    
    }
} else {
    header("HTTP/1.1 401 Unauthorized");
}


?>
