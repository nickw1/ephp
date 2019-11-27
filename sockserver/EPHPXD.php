<?php

require_once('../defines.php');
require_once(XDCLIENT_DIR.'/VarWatcher.php');
require_once(XDCLIENT_DIR.'/MultiUserEmitter.php');

class EPHPXD extends XDClient\VarWatcher {
    public function __construct(XDClient\MultiUserEmitter $emitter) {

        parent::__construct($emitter);
        $this->config = json_decode(file_get_contents("/var/www/html/ephp/config.json"));
    }

    public function onInit($doc) {
        return ($doc["fileuri"] && $this->isUserDebugScript($doc["fileuri"])) ? parent::onInit($doc) : false;
    }

    protected function isUserDebugScript($fileuri) {
        $sfileuri=(string)$fileuri;
        $expectedPath = $this->config->ftp == 1 ?
            str_replace("/", "\/", HOME_DIR."/ephp\d{3}/".USER_WEB_DIR):
            str_replace("/", "\/",WEBROOT."/".NOFTP_USER_ROOT."/ephp\d{3}");
        $testRegexp = "/^file:\/\/$expectedPath\/.+\.php$/";
           $match = preg_match($testRegexp, $sfileuri);
        echo $match ? "$fileuri matches expected pattern\n" : "$fileuri doesn't match expected pattern\n";
        return $match;
    }
}

?>
