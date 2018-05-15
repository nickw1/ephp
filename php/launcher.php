<?php

// launcher.php

require_once('../defines.php');


session_start();

//$_SESSION["ephpuser"] = "ephp001";
//$user = $_SESSION["username"];
//$script = $_POST["script"];

$user = isset($_POST["overrideUser"])  ? $_POST["overrideUser"] :
    (isset($_SESSION["ephpuser"]) ? $_SESSION["ephpuser"]: null);


$cmd = isset($_POST["cmd"]) && ctype_alpha($_POST["cmd"]) ? $_POST["cmd"] : 
        (isset($argv[1]) && ctype_alpha($argv[1])  ? $argv[1]: "start");
$stopping = $cmd=="stop";

if($stopping || ($user!=null && preg_match("/^ephp\d{3}$/",  $user))) {

    $data = isset($_POST["data"]) ? $_POST["data"] : 
        (isset($argv[2])  ? $argv[2]: "");


    $scripts = ["wsocksrv", "xdclient"];

//    $t = time() % 10000000;
    $t = (round(microtime(true)*1000)) % 1000000;
    for($i=($stopping ? count($scripts)-1 : 0); 
        $i!=($stopping ?  -1: count($scripts));
        $i+=($stopping ? -1:1)) {
        

        $cmd1="/usr/bin/php ".SCRIPTDIR."{$scripts[$i]}.php $cmd $data ".
                ">> ".TMPDIR."out.txt ".
                "2> ".TMPDIR."{$scripts[$i]}_{$cmd}_{$user}_".$t."_err.txt ".
                "&";

//        $cmd1="/usr/bin/php ".SCRIPTDIR."{$scripts[$i]}.php $cmd $data ".  "> /dev/null 2> /dev/null";
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
    //$user = $_SESSION["ephpuser"];
    echo json_encode(["user"=>$user]);
} else {
    echo json_encode(["error"=>"Not logged in as an EPHP user","user"=>$user]);
}
?>

