<?php
require_once('../defines.php');
require_once(XDCLIENT_DIR.'/Emitter.php');

abstract class MultiUserEmitter implements \XDClient\Emitter {
    protected $user;

    public function setUser($user) {
        $this->user=$user;
    }

    protected function addUserToData($data) {
        $m= array_merge(["user"=>$this->user],$data);
		return $m;
    }
}

?>
