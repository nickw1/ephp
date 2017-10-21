<?php

// launcher.php

define('TMPDIR','/var/www/tmp/');
define('SCRIPTDIR','/var/www/_scripts/');

session_start();

$_SESSION["ephpuser"] = "ephp001";
//$user = $_SESSION["username"];
//$script = $_POST["script"];


$user = null;

if(isset($_SESSION["ephpuser"]) &&
        preg_match("/^ephp\d{3}$/", $_SESSION["ephpuser"])) {

	$cmd = isset($_POST["cmd"]) && ctype_alpha($_POST["cmd"]) ? $_POST["cmd"] : 
		(isset($argv[1]) && ctype_alpha($argv[1])  ? $argv[1]: "start");
	$data = isset($_POST["data"]) ? $_POST["data"] : 
		(isset($argv[2])  ? $argv[2]: "");


    $stopping = $cmd=="stop";
    $scripts = ["wsocksrv", "xdclient"];

    for($i=($stopping ? count($scripts)-1 : 0); 
        $i!=($stopping ?  -1: count($scripts));
        $i+=($stopping ? -1:1)) {
        $cmd1="/usr/bin/php ".SCRIPTDIR."{$scripts[$i]}.php $cmd $data ".
				"> ".TMPDIR."{$scripts[$i]}_{$cmd}_out.txt &";
        system($cmd1);
        usleep(500000);
    }
    if($stopping) {
        $files=glob("/var/www/tmp/*_out.txt");
        foreach($files as $file) {
            if(is_file($file)) {
//                unlink($file);
            }
        }
    }
    $user = $_SESSION["ephpuser"];
	echo json_encode(["user"=>$user]);
} else {
	echo json_encode(["error"=>"Not logged in as an EPHP user"]);
}
?>

