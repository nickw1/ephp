<?php

// launcher.php

define('TMPDIR','/var/www/tmp/');
define('SCRIPTDIR','/var/www/_scripts/');

session_start();

//$user = $_SESSION["username"];
//$script = $_POST["script"];

$_SESSION["ephpuser"] = "ephp001";

$user = null;

if(isset($_SESSION["ephpuser"]) &&
		preg_match("/^ephp\d{3}$/", $_SESSION["ephpuser"])) {
	$cmd = (isset($_POST["cmd"]) && $_POST["cmd"]=="stop") ? "stop":"";

    $scripts = ["wsocksrv", "xdclient"];

    foreach($scripts as $script) {
		
        $cmd1="/usr/bin/php ".SCRIPTDIR."{$script}.php $cmd > ".
                TMPDIR."{$script}_out.txt &";
		system($cmd1);
        usleep(500000);
    }
	$user = $_SESSION["ephpuser"];
}
echo json_encode(["user"=>$user]);
?>
