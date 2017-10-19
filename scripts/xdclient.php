<?php 

// see Rady Cristescu's comment on getmypid() manual page
define('TMPDIR','/var/www/tmp/');
define('LOCKFILE', TMPDIR."xdclient.lock");

require('EPHPXDClient.php');
require('ZMQEmitter.php');

$xdupdateport = 9001;
$launchport = 9002;

if(count($argv) > 1 && $argv[1]=="stop") {
    $client=stream_socket_client("tcp://127.0.0.1:$launchport",$errno,$errmsg);
    if($client!==false) {
        fwrite($client,"STOP");
        $recv = stream_get_contents($client);
        if($recv=="STOPPED") {
            unlink(LOCKFILE);
        }
        fclose($client);
    } else {
        echo json_encode(["status"=>"error","error"=>$errmsg]);
    }
} else {
    register_shutdown_function('unlink_with_test', LOCKFILE);
    try {
        if(@symlink("/proc/".getmypid(),LOCKFILE)!==false) {
            $dc = new EPHPXDClient(new ZMQEmitter('127.0.0.1', $xdupdateport));
            $dc->init(9000, $launchport);
            $dc->run();
        } else {
            echo json_encode(["status"=>"ignored"]); 
        }
    } catch(Exception $e) {
        echo $e->getMessage(); 
    }    
}

function unlink_with_test($file) {
    if(file_exists($file)) {
        unlink($file);
    }
}
?>

        
