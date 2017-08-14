<?php 

require('EPHPXDClient.php');
require('ZMQEmitter.php');

try {
    echo "creating dbgp client\n";
    $dc = new EPHPXDClient("xdtest.php", 
                        "ephp001", "ephp001", DBPASS, 
                        new ZMQEmitter('127.0.0.1', 9001));
    $dc->init(9000);
    $dc->run();
} catch(Exception $e) {
    echo $e->getMessage()."\n";
}    

?>

        
