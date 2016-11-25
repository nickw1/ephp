<?php

require_once('FileUploadFtpHandler.php');
require_once('PostFtpHandler.php');

session_start();


$u = isset($_POST["username"]) ? $_POST["username"] :
        (isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]: null);
$p = isset($_POST["password"]) ? $_POST["password"] :
        (isset($_SESSION["ephppass"]) ? $_SESSION["ephppass"]: null);
if($_SERVER["REQUEST_METHOD"]=="POST") {
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
    if($u!=null && $p!=null && $ftp->login ($u, $p) == 0) {
        if($_SERVER["REQUEST_METHOD"]=="GET") {
            $dlresult = $ftp->downloadFtp($_GET["dir"]."/".$_GET["file"]);
            if(ctype_digit($dlresult)) {
                $output["status"] = $dlresult;
            } else {
                $output["status"] = 0;
                $output["content"] = $dlresult;
				$output["contentType"] = "text/html";
            }
        } else {
            $output["status"] = $ftp->uploadAndFtp();
        }
    } else {
		$output["status"] = FtpHandler::INVALID_LOGIN;
	}
}    
$output["loggedin"] = isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]:null;
echo json_encode($output);
?>
