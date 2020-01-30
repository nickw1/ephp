<?php

// heavily cut down version of original analyser.php
// simply retrieves a given php script source code, but checks that the
// current user owns the script
session_start();

require_once('../defines.php');

header("Content-type: application/json");

$config = json_decode(file_get_contents("../config.json"), true);
$errors = array();


$target = $_SERVER["REQUEST_METHOD"]=="POST" ? $_POST["target"]:$_GET["target"];

$httpCode = 200;


if(!isset($_SESSION["ephpuser"])) {
    $errors[] = "Not logged in.";
}
elseif(($fileinfo=get_php_filename($target,$config["ephproot"],$config["ftp"]))
        ==null) {
    $errors[] = "Can only read from ephp-designated directories.";
} else {
    list($expectedUsername, $targetfile) = $fileinfo;
    if($expectedUsername != $_SESSION["ephpuser"]) {
        $errors[] = "Cannot read another user's files.";
    } else {
        if(($target_contents = @file_get_contents($targetfile))===false) {
            $errors[] = "Cannot open specified PHP file on server $targetfile.";
            $httpCode = 404;
        }
    } 
} 

if(empty($errors)) {
    $srclines = explode("\n", $target_contents);
    $json = array (
        //"php" => htmlentities($target_contents), 
        "src" => $srclines,
                ); 
    /* 190119 WTF? this code is doing nothing !!!
        $httpCode = $script_result["status"]["code"];
    */
} else { 
    $json = array ("errors" => $errors);
}


header("HTTP/1.1 $httpCode");
echo json_encode($json);

        

function get_php_filename($target, $ephproot, $ftp)
{
    $matches=array();
    $regexp = $ftp==1 ?
        "/^\/~(${ephproot}\d{3})\/([a-zA-Z0-9_\/\-]+\.php)$/":
        "/^\/".NOFTP_USER_ROOT.
            "\/(${ephproot}\d{3})\/([a-zA-Z0-9_\/\-]+\.php)$/";
    // can only get php files from specific ephp directories (sandbox)
    if(preg_match($regexp,$target,$matches)) {
        return array ($matches[1],$ftp==1?
            HOME_DIR."/$matches[1]/".USER_WEB_DIR."/$matches[2]":
            WEBROOT."/".NOFTP_USER_ROOT."/$matches[1]/$matches[2]");
    }
    return null;
}
?>
