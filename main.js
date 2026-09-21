// Registering Horror Planet
Events.on(ContentInitEvent, e => {
    const erebus = new Planet("erebus", Planets.sun, 1, 1.5);
    
    erebus.localizedName = "[red]Erebus (Sector X)[]";
    erebus.description = "Заброшенная планета, искажённая неизвестной пространственной аномалией. Связь нестабильна.";
    erebus.hasAtmosphere = true;
    erebus.atmosphereColor = Color.valueOf("3a0007"); // Кроваво-красная атмосфера
    erebus.atmosphereRadIn = 0.04;
    erebus.atmosphereRadOut = 0.4;
    erebus.color = Color.valueOf("110e17"); // Почти чёрная планета
    erebus.startSector = 1;
    erebus.alwaysUnlocked = true;
    erebus.accessible = true;
    
    erebus.generator = new HexSkyMesh(erebus, 6);
});

// Anomaly Logic System
var nextAnomalyTime = 0;

Events.on(Trigger.update, () => {
    if (!Vars.state.isGame()) return;
    
    // Таймер запуска аномалий
    if (Time.time > nextAnomalyTime) {
        // Рандомный интервал от 40 до 80 секунд (60 тиков = 1 сек)
        nextAnomalyTime = Time.time + Mathf.random(2400, 4800);
        
        triggerRandomAnomaly();
    }
});

function triggerRandomAnomaly() {
    let type = Mathf.randomInt(1, 3);
    
    if (type === 1) {
        // АНОМАЛИЯ 1: Пси-Шторм
        Vars.ui.hudfrag.showToast("[red]⚠️ ВНИМАНИЕ: ПСИ-ШТОРМ! СИСТЕМЫ СБОЯТ!");
        Sounds.spell.at(Vars.player.x, Vars.player.y);
        
        if (Vars.player.unit()) {
            Fx.nucleonics.at(Vars.player.x, Vars.player.y);
            Vars.player.unit().damage(Vars.player.unit().maxHealth * 0.3); // Минус 30% ХП
        }
    } 
    else if (type === 2) {
        // АНОМАЛИЯ 2: Спавн Фантома
        Vars.ui.hudfrag.showToast("[purple]👻 ОБНАРУЖЕН ПРОСТРАНСТВЕННЫЙ РАЗРЫВ...");
        
        let spawnX = Vars.player.x + Mathf.range(150);
        let spawnY = Vars.player.y + Mathf.range(150);
        
        Fx.portal.at(spawnX, spawnY);
        Sounds.witch.at(spawnX, spawnY);
        
        // Спавним сильного вражеского юнита (например, Eclipse или Corvus)
        UnitTypes.eclipse.spawn(Team.crux, spawnX, spawnY);
    } 
    else if (type === 3) {
        // АНОМАЛИЯ 3: Взрыв энергии
        Vars.ui.hudfrag.showToast("[yellow]⚡ ЭЛЕКТРОМАГНИТНЫЙ ИМПУЛЬС!");
        Fx.shockwave.at(Vars.player.x, Vars.player.y);
        Sounds.spark.at(Vars.player.x, Vars.player.y);
    }
}
