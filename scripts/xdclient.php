<?php 

// see Rady Cristescu's comment on getmypid() manual page
require('EPHPXDClient.php');
require('ZMQEmitter.php');
define('LOCKFILE', TMPDIR."xdclient.lock");


$xdupdateport = 9001;
$launchport = 9002;

if(count($argv) > 1 && $argv[1]!="start") {
    $client=stream_socket_client("tcp://127.0.0.1:$launchport",$errno,$errmsg);
    if($client!==false) {
		$data = [ "cmd" => $argv[1] ];
		if(isset($argv[2])) {
			$data["data"] = $argv[2];
		}
        fwrite($client, json_encode($data));
        $recv = stream_get_contents($client);
        if($recv=="STOPPED") {
            unlink_with_test(LOCKFILE);
        }
        fclose($client);
    } else {
        echo json_encode(["status"=>"error","error"=>$errmsg]);
		exit;
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

        
