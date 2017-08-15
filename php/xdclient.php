<?php 

// see Rady Cristescu's comment on getmypid() manual page
define('TMPDIR','/home/nick/tmp/');
define('LOCKFILE', TMPDIR."xdclient.lock");

require('EPHPXDClient.php');
require('ZMQEmitter.php');

try {
    register_shutdown_function('unlink',LOCKFILE);
    if(@symlink("/proc/".getmypid(),LOCKFILE)!==false) {
        echo "creating dbgp client\n";
        $dc = new EPHPXDClient("/home/nick/public_html/sock/xdtest.php", 
                        "ephp001", "ephp001", DBPASS, 
                     new ZMQEmitter('127.0.0.1', 9001));
        $dc->init(9000);
        $dc->run();
    } else {
        echo "xdclient already running";
    }
} catch(Exception $e) {
    echo $e->getMessage()."\n";
}    

?>

        
