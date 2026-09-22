(function() {
    var scope = (typeof vars !== 'undefined') ? this : (function() { return this; })();
    var states = { god: false, vacuum: false };
    
    // Память для восстановления честного прогресса исследований
    var savedResearch = []; 

    var printHelp = function() {
        Log.info("\n=== ULTRASCRIPT V21.0 ===");
        Log.info("creative : Ресурсы + Все исследования");
        Log.info("editor : Редактор");
        Log.info("god : Бессмертие");
        Log.info("vacuum : Авто-сбор ресурсов из буров в Ядро");
        Log.info("instant : Мгновенная стройка");
        Log.info("win : Захватить сектор");
        Log.info("kill : Убить врагов");
        Log.info("fill : Заполнить ядро");
        Log.info("ammo : Заполнить все турели патронами");
        Log.info("dump : Очистить ядро");
        Log.info("heal : Исцелить постройки");
        Log.info("spawn : Спавн юнита");
        Log.info("off : Сброс настроек");
        Log.info("=========================");
    };

    Events.on(EventType.WorldLoadEvent, printHelp);

    Events.on(EventType.UnitControlEvent, function() {
        var u = Vars.player.unit();
        if (u && states.god) {
            u.health = u.maxHealth;
            u.shield = 999999;
        }
    });

    Events.on(EventType.Trigger.update, function() {
        if (!Vars.state.isGame()) return;
        
        var u = Vars.player.unit();
        if (u && states.god) {
            u.health = u.maxHealth;
            u.shield = 999999;
        }

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

    // Идеальная команда creative со взломом флага alwaysUnlocked
    Object.defineProperty(scope, 'creative', { get: function() { 
        Vars.state.rules.infiniteResources = !Vars.state.rules.infiniteResources; 
        
        if (Vars.state.rules.infiniteResources) {
            savedResearch = []; // Очищаем временную память перед записью
            
            Vars.content.each(function(c) {
                if (c instanceof Packages.mindustry.type.UnlockableContent) {
                    // Сохраняем исходное состояние, чтобы потом его вернуть
                    savedResearch.push({
                        content: c,
                        wasAlwaysUnlocked: c.alwaysUnlocked,
                        wasUnlocked: c.unlocked()
                    });
                    
                    // Вламываемся в движок и делаем технологию "всегда доступной"
                    c.alwaysUnlocked = true;
                    c.unlock();
                    
                    if (c.techNode) {
                        c.techNode.unlocked = true;
                    }
                }
            });
            return "Creative: ON (Все технологии разблокированы, замочки сняты!)";
        } else {
            // Возвращаем все исследования к исходному честному состоянию
            for (var i = 0; i < savedResearch.length; i++) {
                var data = savedResearch[i];
                data.content.alwaysUnlocked = data.wasAlwaysUnlocked;
                
                if (!data.wasUnlocked) {
                    // Если блок не был изучен ранее, закрываем его обратно
                    if (data.content.techNode) {
                        data.content.techNode.unlocked = false;
                    }
                }
            }
            savedResearch = []; // Очищаем память
            return "Creative: OFF (Технологии возвращены под замочки)";
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
        return "Vacuum: " + (states.vacuum ? "ON" : "OFF"); 
    }, configurable: true });
    
    Object.defineProperty(scope, 'instant', { get: function() { Vars.state.rules.buildSpeedMultiplier = (Vars.state.rules.buildSpeedMultiplier == 1 ? 9999 : 1); return "Instant Build: " + (Vars.state.rules.buildSpeedMultiplier > 1 ? "ON" : "OFF"); }, configurable: true });
    
    Object.defineProperty(scope, 'win', { get: function() { 
        if (Vars.state.isCampaign()) {
            Vars.state.rules.victory = true;
            
            Groups.build.each(function(b) {
                if (b.team != Vars.player.team()) {
                    b.kill();
                }
            });
            
            Groups.unit.each(function(u) {
                if (u.team != Vars.player.team()) {
                    u.kill();
                }
            });
            
            Events.fire(new EventType.GameOverEvent(Vars.player.team()));
            return "Сектор успешно захвачен! Запущен экран победы.";
        }
        return "Ошибка: Вы должны находиться в режиме Кампании!";
    }, configurable: true });

    Object.defineProperty(scope, 'kill', { get: function() { Groups.unit.each(function(u) { if (u.team != Vars.player.team()) u.kill(); }); return "Враги уничтожены"; }, configurable: true });
    
    Object.defineProperty(scope, 'fill', { get: function() { 
        var unit = Vars.player.unit();
        if(unit && unit.core()) {
            Vars.content.items().each(function(i) { unit.core().items.set(i, unit.core().storageCapacity); });
            return "Ядро заполнено!"; 
        }
        return "Нет ядра"; 
    }, configurable: true });

    Object.defineProperty(scope, 'ammo', { get: function() { 
        var count = 0;
        Groups.build.each(function(b) { 
            if (b.team == Vars.player.team() && b instanceof Packages.mindustry.world.blocks.defense.turrets.Turret.TurretBuild) {
                var block = b.block;
                
                if (block.ammoTypes) {
                    Vars.content.items().each(function(i) {
                        if (block.ammoTypes.containsKey(i)) {
                            for (var c = 0; c < block.maxAmmo; c++) {
                                b.handleItem(null, i);
                            }
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
        return "Все турели полностью заряжены! Всего: " + count; 
    }, configurable: true });

    Object.defineProperty(scope, 'dump', { get: function() { var c = Vars.player.unit() ? Vars.player.unit().core() : null; if(c) { c.items.clear(); return "Ядро очищено"; } return "Нет ядра"; }, configurable: true });
    Object.defineProperty(scope, 'heal', { get: function() { Groups.build.each(function(b) { if (b.team == Vars.player.team()) b.health = b.maxHealth; }); return "Постройки исцелены"; }, configurable: true });
    
    Object.defineProperty(scope, 'off', { get: function() { 
        states.god = false; 
        states.vacuum = false;
        Vars.state.rules.infiniteResources = false; 
        Vars.state.rules.editor = false; 
        Vars.state.rules.buildSpeedMultiplier = 1; 
        if(Vars.player.unit()) Vars.player.unit().shield = 0; 
        
        // Сброс исследований
        for (var i = 0; i < savedResearch.length; i++) {
            var data = savedResearch[i];
            data.content.alwaysUnlocked = data.wasAlwaysUnlocked;
            if (!data.wasUnlocked && data.content.techNode) {
                data.content.techNode.unlocked = false;
            }
        }
        savedResearch = [];
        return "Системы сброшены"; 
    }, configurable: true });

    scope.spawn = function(name) {
        var type = Vars.content.units().find(function(u) { return u.name.includes(name); });
        if (type) {
            var u = type.create(Vars.player.team());
            u.set(Vars.player.x, Vars.player.y);
            u.add();
            return type.name + " заспавнен!";
        }
        return "Ошибка: юнит не найден.";
    };
})();
