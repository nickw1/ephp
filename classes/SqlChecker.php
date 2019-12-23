<?php

// SQL parser
// takes an sql statement and executes it - as long as it's safe

require('../vendor/autoload.php');

class PartChecker {


    private $partCheckInfo = [ 
            "colref" => 
            ["regex"=>"/^[\w\*\.\s]+$/", 
             "checkField" => "base_expr",  
             "addFields" => ["base_expr", "delim"]
            ],
        "table" => 
            ["regex"=>"/^[\w\,\*\.]+$/", 
             "checkField" => "table", 
              "addFields"=> [ "base_expr" ]
            ],
         "const" => 
            [ "regex" => "/^[\w\d\s_\'\"]+$/",
            "checkField" => "base_expr",
            "addFields"=> ["base_expr"] 
            ],
        "operator"=>
            [ "addFields" => [ "base_expr" ] 
            ]
    ];

    function checkAll($parts) {
        $sqlFrags = [];
        foreach($parts as $part) {
            if(($res = $this->check($part)) !== false) {
                $sqlFrags = array_merge($sqlFrags, $res);
            }
        }
        return $sqlFrags;
    }

    function check($part) {
        $retval = false;
        $partCheckExpr = $this->partCheckInfo[$part["expr_type"]];
        if($partCheckExpr && 
            (!isset($partCheckExpr["regex"]) || 
             preg_match($partCheckExpr["regex"], $part[$partCheckExpr["checkField"]])                )) {
            $retval = array_map ( function($k) use ($part) {
                return $part[$k];    
            }, $partCheckExpr["addFields"]); 
        }
        return $retval;
    }
};

class SqlChecker {


    private $partChecker = false;

    function __construct($sql) {
        if(preg_match("/^[\w\s\d,\.\*\'\"=\(\)]+$/", $sql)) {
            $parser = new PHPSQLParser\PHPSQLParser();
            $this->parsed = $parser->parse($sql);
            $this->partChecker = new PartChecker();
        }

    }

    function isValid() {
        return $this->parsed !== false;
    }

    function potentiallyUnsafe() {
        return $this->partChecker === false;
    }

    function isSelect() {
        return array_keys($this->parsed)[0] == "SELECT";
    }

    function makeSafeSql() {
        $curStatement = false;
        $safeSql = [];
        $stmtCount = 0;
        foreach($this->parsed as $k=>$v) {
           if($stmtCount > 1) break;
           switch($k) {
                case "SELECT":
                    if(++$stmtCount == 1) {
                        $safeSql[] = $k;
                        $safeSql = array_merge($safeSql, $this->partChecker->checkAll($v));
                    }
                    break;

                case "INSERT":
                case "UPDATE":
                case "DELETE":
                case "ALTER":
                case "DROP":
                    $stmtCount++;
                    break;


                case "FROM":
                    $safeSql[] = $k;
                    $tables = $this->partChecker->checkAll($v);
                    $safeSql[] = implode(",", $tables);
                    break;


                case "WHERE":
                    $safeSql[] = $k;
                    $safeSql = array_merge($safeSql, $this->partChecker->checkAll($v));
                    break;
            }
        }
        return $safeSql;
    }
}
?>
