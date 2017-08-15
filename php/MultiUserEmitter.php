<?php
require_once('../../xdclient/Emitter.php');

abstract class MultiUserEmitter implements \XDClient\Emitter {
    protected $user;

    public function setUser($user) {
        $this->user=$user;
    }

    protected function addUserToData($data) {
        return array_merge(["user"=>$this->user],$data);
    }
}

?>
