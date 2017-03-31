<?php

require_once('FileUploadFtpHandler.php');
require_once('PostFtpHandler.php');

session_start();
// $server = EPHP_HOSTNAME;
$server = "193.63.200.53";
$u = isset($_POST["ephp_username"]) ? $_POST["ephp_username"] :
        (isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]: null);
$p = isset($_POST["ephp_password"]) ? $_POST["ephp_password"] :
        (isset($_SESSION["ephppass"]) ? $_SESSION["ephppass"]: null);
if($_SERVER["REQUEST_METHOD"]=="POST") {
    if(isset($_FILES["file"])) {
        $ftp = new FileUploadFtpHandler($server,
                    new FileUploader("file",1048576));
    } else {
        $ftp = new PostFtpHandler
            ($server, $_POST["src"], $_POST["filename"]);
    }
} else {
    $ftp = new FtpHandler($server);
}

$output = array();
header("Content-type: application/json");
if (($output["status"] = $ftp->connect()) == 0) {
    if($u!=null && $p!=null && $ftp->login ($u, $p) == 0) {
        switch($_SERVER["REQUEST_METHOD"]) {
            case 'GET':
                $dlresult = $ftp->downloadFtp($_GET["dir"]."/".$_GET["file"]);
                if(ctype_digit($dlresult)) {
                    $output["status"] = $dlresult;
                } else {
                    $output["status"] = 0;
                    $output["content"] = $dlresult;
                    $output["contentType"] = "text/html";
                }
                break;
            case 'POST':
        $output["action"] = $_POST["action"];
        if($_POST["action"]=="delete") {
            $files = json_decode($_POST["files"]);
            $result=$ftp->delete($files);
            if(ctype_digit($result)) {
                $output["status"] = $result;
            } else {
                $output["status"] = 0;
                $output["failures"] = $result;
            }
        } else {
                    $output["status"] = $ftp->uploadAndFtp();
        }
                break;
        }
    } else {
        $output["status"] = FtpHandler::INVALID_LOGIN;
    }
}    
$output["loggedin"] = isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]:null;
echo json_encode($output);
?>
