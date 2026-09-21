(function() {
    var scope = (typeof vars !== 'undefined') ? this : (function() { return this; })();
    var states = { 
        god: false,
        vacuum: false 
    };
    
    // Память для восстановления честного прогресса исследований
    var savedResearch = []; 

    var printHelp = function() {
        Log.info("\n=== ULTRASCRIPT V22.0 (FINAL EDITION) ===");
        Log.info("creative : Ресурсы + Все исследования (toggle)");
        Log.info("editor   : Редактор карты (toggle)");
        Log.info("god      : Полное бессмертие + Щит (toggle)");
        Log.info("instant  : Мгновенная стройка (toggle)");
        Log.info("vacuum   : Авто-сбор ресурсов из буров в Ядро (toggle)");
        Log.info("win      : Моментальная победа в секторе");
        Log.info("kill     : Убить ВСЕХ врагов на карте");
        Log.info("killnear : Убить врагов вокруг вас");
        Log.info("fill     : Заполнить ядро предметами");
        Log.info("ammo     : Зарядить все турели и дать энергию");
        Log.info("dump     : Очистить ядро");
        Log.info("heal     : Полноценно исцелить и потушить все постройки");
        Log.info("tp       : Телепорт юнита к курсору");
        Log.info("spawn('имя') : Заспавнить юнита (например: spawn('flare'))");
        Log.info("off      : Выключить все читы и сбросить правила");
        Log.info("=========================================");
    };

    // При высадке на карту выводим хелп
    Events.on(Packages.mindustry.game.EventType.WorldLoadEvent, printHelp);

    // Постоянный цикл поддержки бессмертия и вакуума
    Events.on(Packages.mindustry.game.EventType.Trigger.update, function() {
        if (!Vars.state.isGame()) return;
        
        var u = Vars.player.unit();
        if (u && states.god) {
            u.health = u.maxHealth;
            u.shield = 999999;
        }

        // Авто-перенос из буров
        if (states.vacuum && u && u.core()) {
            var core = u.core();
            Groups.build.each(function(b) {
                if (b.team == Vars.player.team() && b.items && b.items.total() > 0 && b != core) {
                    b.items.each(function(item, amount) {
                        core.handleItem(null, item);
                    });
                    b.items.clear();
                }
            });
        }
    });

    Object.defineProperty(scope, 'help', { get: function() { printHelp(); return ""; }, configurable: true });

    // Идеальная команда creative
    Object.defineProperty(scope, 'creative', { get: function() { 
        Vars.state.rules.infiniteResources = !Vars.state.rules.infiniteResources; 
        
        if (Vars.state.rules.infiniteResources) {
            savedResearch = [];
            
            Vars.content.each(function(c) {
                if (c instanceof Packages.mindustry.type.UnlockableContent) {
                    savedResearch.push({
                        content: c,
                        wasAlwaysUnlocked: c.alwaysUnlocked,
                        wasUnlocked: c.unlocked()
                    });
                    
                    c.alwaysUnlocked = true;
                    c.unlock();
                    
                    if (c.techNode) {
                        c.techNode.unlocked = true;
                    }
                }
            });
            return "Creative: ON (Все технологии открыты!)";
        } else {
            for (var i = 0; i < savedResearch.length; i++) {
                var data = savedResearch[i];
                data.content.alwaysUnlocked = data.wasAlwaysUnlocked;
                
                if (!data.wasUnlocked && data.content.techNode) {
                    data.content.techNode.unlocked = false;
                }
            }
            savedResearch = [];
            return "Creative: OFF (Исследования возвращены)";
        }
    }, configurable: true });

    Object.defineProperty(scope, 'editor', { get: function() { Vars.state.rules.editor = !Vars.state.rules.editor; return "Editor: " + (Vars.state.rules.editor ? "ON" : "OFF"); }, configurable: true });
    
    Object.defineProperty(scope, 'god', { get: function() { 
        states.god = !states.god; 
        var u = Vars.player.unit();
        if (u) {
            if (states.god) {
                u.health = u.maxHealth;
                u.shield = 999999;
            } else {
                u.shield = 0;
            }
        }
        return "God Mode: " + (states.god ? "ON" : "OFF"); 
    }, configurable: true });

    Object.defineProperty(scope, 'vacuum', { get: function() { 
        states.vacuum = !states.vacuum; 
        return "Vacuum Drill: " + (states.vacuum ? "ON" : "OFF"); 
    }, configurable: true });
    
    Object.defineProperty(scope, 'instant', { get: function() { 
        Vars.state.rules.buildSpeedMultiplier = (Vars.state.rules.buildSpeedMultiplier == 1 ? 9999 : 1); 
        return "Instant Build: " + (Vars.state.rules.buildSpeedMultiplier > 1 ? "ON" : "OFF"); 
    }, configurable: true });

    Object.defineProperty(scope, 'tp', { get: function() { 
        var u = Vars.player.unit();
        if (u) {
            u.set(Vars.player.mouseX, Vars.player.mouseY);
            return "Телепортирован в point (" + Math.round(Vars.player.mouseX) + ", " + Math.round(Vars.player.mouseY) + ")";
        }
        return "Ошибка: нет юнита.";
    }, configurable: true });
    
    Object.defineProperty(scope, 'win', { get: function() { 
        if (Vars.state.isCampaign()) {
            Vars.state.rules.victory = true;
            
            Groups.build.each(function(b) {
                if (b.team != Vars.player.team()) b.kill();
            });
            
            Groups.unit.each(function(u) {
                if (u.team != Vars.player.team()) u.kill();
            });
            
            Events.fire(new Packages.mindustry.game.EventType.GameOverEvent(Vars.player.team()));
            return "Сектор успешно захвачен! Запущен экран победы.";
        }
        return "Ошибка: Работает только в режиме Кампании!";
    }, configurable: true });

    Object.defineProperty(scope, 'kill', { get: function() { 
        var count = 0;
        Groups.unit.each(function(u) { 
            if (u.team != Vars.player.team()) { u.kill(); count++; } 
        }); 
        return "Уничтожено врагов: " + count; 
    }, configurable: true });

    Object.defineProperty(scope, 'killnear', { get: function() { 
        var u = Vars.player.unit();
        if (!u) return "Нет юнита";
        var count = 0;
        Groups.unit.each(function(other) { 
            if (other.team != Vars.player.team() && other.within(u.x, u.y, 400)) { 
                other.kill(); 
                count++; 
            } 
        }); 
        return "Уничтожено врагов в радиусе: " + count; 
    }, configurable: true });
    
    Object.defineProperty(scope, 'fill', { get: function() { 
        var unit = Vars.player.unit();
        if(unit && unit.core()) {
            Vars.content.items().each(function(i) { unit.core().items.set(i, unit.core().storageCapacity); });
            return "Ядро заполнено!"; 
        }
        return "Ошибка: Ядро не найдено"; 
    }, configurable: true });

    Object.defineProperty(scope, 'ammo', { get: function() { 
        var count = 0;
        Groups.build.each(function(b) { 
            if (b.team == Vars.player.team() && b instanceof Packages.mindustry.world.blocks.defense.turrets.Turret.TurretBuild) {
                var block = b.block;
                if (block.ammoTypes) {
                    Vars.content.items().each(function(i) {
                        if (block.ammoTypes.containsKey(i)) {
                            b.items.set(i, block.itemCapacity);
                        }
                    });
                }
                if (b.liquids) {
                    Vars.content.liquids().each(function(l) {
                        b.liquids.set(l, block.liquidCapacity);
                    });
                }
                if (b.cons && b.cons.power) {
                    b.power.status = 1;
                }
                count++;
            }
        });
        return "Заряжено турелей: " + count; 
    }, configurable: true });

    Object.defineProperty(scope, 'dump', { get: function() { 
        var c = Vars.player.unit() ? Vars.player.unit().core() : null; 
        if(c) { c.items.clear(); return "Ядро очищено"; } 
        return "Ошибка: Ядро не найдено"; 
    }, configurable: true });

    Object.defineProperty(scope, 'heal', { get: function() { 
        var count = 0;
        Groups.build.each(function(b) { 
            if (b.team == Vars.player.team()) {
                b.health = b.maxHealth;
                if (b.fire) b.fire.remove();
                count++;
            } 
        }); 
        return "Исцелено построек: " + count; 
    }, configurable: true });
    
    Object.defineProperty(scope, 'off', { get: function() { 
        states.god = false; 
        states.vacuum = false;
        Vars.state.rules.infiniteResources = false; 
        Vars.state.rules.editor = false; 
        Vars.state.rules.buildSpeedMultiplier = 1; 
        if(Vars.player.unit()) Vars.player.unit().shield = 0; 
        
        for (var i = 0; i < savedResearch.length; i++) {
            var data = savedResearch[i];
            data.content.alwaysUnlocked = data.wasAlwaysUnlocked;
            if (!data.wasUnlocked && data.content.techNode) {
                data.content.techNode.unlocked = false;
            }
        }
        savedResearch = [];
        return "Все чит-системы отключены"; 
    }, configurable: true });

    scope.spawn = function(name) {
        if (!name) {
            return "Использование: spawn('название')\nПример: spawn('dagger') или spawn('flare')";
        }
        var type = Vars.content.units().find(function(u) { return u.name.toLowerCase().includes(name.toLowerCase()); });
        if (type) {
            var u = type.create(Vars.player.team());
            u.set(Vars.player.x, Vars.player.y);
            u.add();
            return "Юнит [" + type.name + "] заспавнен рядом с вами!";
        }
        return "Ошибка: Юнит с именем '" + name + "' не найден.";
    };
})();
