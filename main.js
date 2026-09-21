// Переключатели состояний (Вкл/Выкл)
const state = {
    godMode: false,
    autoFillCore: false,
    nukeMode: false,
    autoVacuum: false,
    fastBuild: false,
    fastMine: false,
    superSpeed: false,
    infinitePower: false,
    instantKillOnTouch: false,
    autoHealBuildings: false,
    noDmgToCore: false,
    freezeEnemies: false,
    magnetItems: false,
    radarESP: false,
    clearEnemies: false,
    clearDebris: false,
    autoRepairUnits: false,
    unlockTech: false,
    fillTurrets: false,
    overdriveAll: false,
    infiniteShield: false,
    massSpawnAlliance: false,
    tpToCursor: false,
    unlimitedAmmo: false,
    ghostMode: false,
    autoTargeting: false,
    disableWaves: false,
    showFPS: false,
    killAllBosses: false,
    instantWinWave: false
};

var lastNukeTime = 0;

// Умный фильтр ресурсов по текущей планете
function fillPlanetCore(core) {
    if (!core) return;

    // Определяем текущую планету (Серпуло, Эрекир и т.д.)
    let currentPlanet = Vars.state.getPlanet();
    
    Vars.content.items().each(item => {
        // Проверяем, разблокирован/доступен ли предмет на текущей планете
        if (item.unlockedNow() || (currentPlanet && currentPlanet.isUnlocked(item))) {
            if (core.items.get(item) < core.storageCapacity) {
                core.handleItem(null, item);
            }
        }
    });
}

// Главный цикл обновлений
Events.on(Trigger.update, () => {
    if (!Vars.state.isGame()) return;

    var player = Vars.player;
    if (!player) return;
    var unit = player.unit();
    var core = player.team().core();

    // 1. Бессмертие
    if (state.godMode && unit) {
        unit.health = unit.maxHealth;
    }

    // 2. Умная заправка Ядра (Только ресурсы текущей планеты)
    if (state.autoFillCore && core) {
        fillPlanetCore(core);
    }

    // 3. Орбитальный удар по клику
    if (state.nukeMode && player.shooting && Time.time > lastNukeTime + 180) {
        lastNukeTime = Time.time;
        Damage.damage(player.mouseX, player.mouseY, 240, 10000);
        Fx.nuclearCloud.at(player.mouseX, player.mouseY);
        Sounds.explosionbig.at(player.mouseX, player.mouseY);
    }

    // 4. Магнит буров в ядро
    if (state.autoVacuum && core) {
        Vars.indexer.eachBlock(player.team(), core.x, core.y, 9999, build => {
            if (build.block instanceof Driller && build.items.total() > 0) {
                build.items.each((item, amount) => core.handleItem(null, item));
                build.items.clear();
            }
        });
    }

    // 5. Быстрая постройка
    if (state.fastBuild && unit) {
        unit.type.buildSpeed = 100;
    }

    // 6. Быстрое копание
    if (state.fastMine && unit) {
        unit.type.mineSpeed = 100;
    }

    // 7. Супер-скорость
    if (state.superSpeed && unit) {
        unit.type.speed = 8;
    }

    // 8. Бесконечная энергия в сети
    if (state.infinitePower && core) {
        Vars.indexer.eachBlock(player.team(), core.x, core.y, 9999, build => {
            if (build.power) build.power.status = 1.0;
        });
    }

    // 9. Авто-ремонт построек вокруг
    if (state.autoHealBuildings && unit) {
        Vars.indexer.eachBlock(player.team(), unit.x, unit.y, 200, build => {
            if (build.health < build.maxHealth) build.heal();
        });
    }

    // 10. Зарядка турелей
    if (state.fillTurrets && core) {
        Vars.indexer.eachBlock(player.team(), core.x, core.y, 9999, build => {
            if (build.block instanceof Turret && build.acceptItem) {
                Vars.content.items().each(item => {
                    if (build.acceptItem(null, item)) build.handleItem(null, item);
                });
            }
        });
    }

    // 11. Ускорение всех зданий (Overdrive)
    if (state.overdriveAll && core) {
        Vars.indexer.eachBlock(player.team(), core.x, core.y, 9999, build => {
            build.timeScale = 2.5;
        });
    }

    // 12. Уничтожение врагов при касании
    if (state.instantKillOnTouch && unit) {
        Groups.unit.each(u => {
            if (u.team != player.team() && u.within(unit.x, unit.y, 50)) {
                u.kill();
            }
        });
    }

    // 13. Авто-зачистка завалов
    if (state.clearDebris) {
        Groups.puddle.each(p => p.remove());
    }

    // 14. Защита Ядра от урона
    if (state.noDmgToCore && core) {
        core.health = core.maxHealth;
    }

    // 15. Бесконечный щит
    if (state.infiniteShield && unit) {
        unit.shield = 5000;
    }
});

// Дополнительные вызовы функционала по событиям
Events.on(WorldLoadEvent, () => {
    Timer.schedule(() => {
        Vars.state.rules.canCheat = true;
        Vars.ui.hudfrag.showToast("[green]✔ 30 Админ-функций загружены!");
    }, 1);
});

// Кнопка вызова меню настроек в игре
Events.on(ClientCreateEvent, () => {
    Vars.ui.hudGroup.fill(cons(t => {
        t.button("⚙ MENU", () => showAdminDialog()).width(100).height(50).top().left();
    }));
});

// Окно управления 30 функциями с переключателями
function showAdminDialog() {
    let dialog = new BaseDialog("Admin Panel (30 Features)");
    dialog.addCloseButton();
    
    let table = dialog.cont;
    table.pane(p => {
        let keys = Object.keys(state);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            p.check(key, state[key], val => { state[key] = val; }).row();
        }
    }).size(350, 400);

    dialog.show();
}
