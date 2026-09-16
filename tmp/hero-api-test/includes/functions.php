<?php
function db() { return new HeroTestDatabase(); }
class HeroTestDatabase {
    function query($sql) {
        if (getenv('HERO_TEST_FAIL')) return false;
        if (strpos($sql, 'WHERE is_active = 1') === false) throw new RuntimeException('Active filter missing');
        return new HeroTestStatement();
    }
}
class HeroTestStatement {
    function fetchAll($mode) { return [['id'=>'7','image'=>'/uploads/hero/new.png','is_active'=>'1','display_order'=>'0','heading'=>'New creative']]; }
}
