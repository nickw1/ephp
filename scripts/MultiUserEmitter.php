<?php
require_once('/home/nick/xdclient/Emitter.php');

abstract class MultiUserEmitter implements \XDClient\Emitter {
    protected $user;

    public function setUser($user) {
        $this->user=$user;
    }

    protected function addUserToData($data) {
		echo "addUserToData()\n";
		print_r($data);
        $m= array_merge(["user"=>$this->user],$data);
		print_r($m);
		return $m;
    }
}

?>
