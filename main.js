// Таймер для следующей аномалии
var nextAnomalyTime = 0;

Events.on(Trigger.update, () => {
    // Проверяем, находится ли игрок в игре и загружена ли карта
    if (!Vars.state.isGame() || Vars.state.isPaused()) return;
    
    // Инициализация первого таймера при старте карты
    if (nextAnomalyTime === 0) {
        nextAnomalyTime = Time.time + Mathf.random(1800, 3600); // От 30 до 60 секунд
        return;
    }
    
    // Когда время пришло — запускаем случайную аномалию
    if (Time.time > nextAnomalyTime) {
        // Задаем интервал до следующей аномалии (30-60 сек)
        nextAnomalyTime = Time.time + Mathf.random(1800, 3600);
        
        triggerRandomAnomaly();
    }
});

function triggerRandomAnomaly() {
    var player = Vars.player;
    if (!player || !player.unit()) return;
    
    var x = player.x;
    var y = player.y;
    var type = Mathf.randomInt(1, 3);
    
    if (type === 1) {
        // АНОМАЛИЯ 1: Пси-Шторм (урон и визуальный эффект)
        Vars.ui.hudfrag.showToast("[red]⚠️ ПСИ-ШТОРМ: Критический сбой систем!");
        
        Fx.nucleonics.at(x, y);
        Fx.sparks.at(x, y);
        Sounds.spell.at(x, y);
        
        // Наносим небольшой урон юниту игрока (20% от максимального ХП)
        var unit = player.unit();
        if (unit) {
            unit.damage(unit.maxHealth * 0.2);
        }
    } 
    else if (type === 2) {
        // АНОМАЛИЯ 2: Пространственный разрыв (спавн врага рядом)
        Vars.ui.hudfrag.showToast("[purple]👻 ОБНАРУЖЕН ПРОСТРАНСТВЕННЫЙ РАЗРЫВ...");
        
        // Точка спавна с небольшим смещением от игрока
        var spawnX = x + Mathf.range(100);
        var spawnY = y + Mathf.range(100);
        
        Fx.portal.at(spawnX, spawnY);
        Sounds.witch.at(spawnX, spawnY);
        
        // Спавним антагониста (Scepter) за вражескую команду Crux
        UnitTypes.scepter.spawn(Team.crux, spawnX, spawnY);
    } 
    else if (type === 3) {
        // АНОМАЛИЯ 3: Электромагнитная вспышка (вспышка и отталкивание)
        Vars.ui.hudfrag.showToast("[yellow]⚡ ЭЛЕКТРОМАГНИТНЫЙ ИМПУЛЬС!");
        
        Fx.shockwave.at(x, y);
        Fx.impactShockwave.at(x, y);
        Sounds.spark.at(x, y);
    }
}
