<?php

require_once('FileUploadFtpHandler.php');
require_once('PostFtpHandler.php');

session_start();


$u = isset($_POST["username"]) ? $_POST["username"] :
        (isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]: null);
$p = isset($_POST["password"]) ? $_POST["password"] :
        (isset($_SESSION["ephppass"]) ? $_SESSION["ephppass"]: null);
$action = isset($_POST["action"]) && $_POST["action"]=="download" ?
	"download":"upload"; 
if($action=="upload") {
	if(isset($_FILES["file"])) {
    	$ftp = new FileUploadFtpHandler(EPHP_HOSTNAME,
        	        new FileUploader("file",1048576));
	} else {
    	$ftp = new PostFtpHandler
			(EPHP_HOSTNAME, $_POST["src"], $_POST["filename"]);
	}
} else {
	$ftp = new FtpHandler(EPHP_HOSTNAME);
}

$output = array();
header("Content-type: application/json");
if (($output["status"] = $ftp->connect()) == 0) {
    if(($output["status"] = $ftp->login ($u, $p)) == 0) {
        if($action=="download") {
            $dlresult = $ftp->downloadFtp($_POST["filename"]);
            if(ctype_digit($dlresult)) {
                $output["status"] = $dlresult;
            } else {
                $output["status"] = 0;
                $output["src"] = $dlresult;
            }
        } else {
            $output["status"] = $ftp->uploadAndFtp();
        }
    } 
}    
$output["loggedin"] = isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]:null;
echo json_encode($output);
?>
