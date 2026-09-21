Events.on(ContentInitEvent, () => {
    // Создаем планету на базе параметров Серпуло, чтобы не вызывать краш сетки
    const erebus = new Planet("erebus", Planets.sun, 1, 2);

    erebus.localizedName = "[red]Erebus[]";
    erebus.description = "Заброшенная мрачная планета, искаженная аномалиями.";
    erebus.hasAtmosphere = true;
    erebus.atmosphereColor = Color.valueOf("3a0007"); // Тёмно-красная атмосфера
    erebus.atmosphereRadIn = 0.02;
    erebus.atmosphereRadOut = 0.3;
    erebus.color = Color.valueOf("1a090d");
    erebus.startSector = 0;
    erebus.alwaysUnlocked = true;
    erebus.accessible = true;
    erebus.visible = true;

    // Используем стандартный генератор Серпуло, чтобы игра НЕ ВЫЛЕТАЛА
    erebus.generator = Planets.serpulo.generator;
    erebus.meshLoader = Planets.serpulo.meshLoader;
});

// Система аномалий прямо во время игры
var nextAnomaly = 0;

Events.on(Trigger.update, () => {
    if (!Vars.state.isGame() || Vars.state.isPaused()) return;

    if (nextAnomaly === 0) {
        nextAnomaly = Time.time + 1200; // Первая аномалия через 20 сек
        return;
    }

    if (Time.time > nextAnomaly) {
        nextAnomaly = Time.time + Mathf.random(1800, 3600); // Каждые 30-60 сек
        
        var p = Vars.player;
        if (!p || !p.unit()) return;

        var type = Mathf.randomInt(1, 3);

        if (type === 1) {
            Vars.ui.hudfrag.showToast("[red]⚠️ ПСИ-ШТОРМ!");
            Fx.nucleonics.at(p.x, p.y);
            Sounds.spell.at(p.x, p.y);
            p.unit().damage(p.unit().maxHealth * 0.2);
        } else if (type === 2) {
            Vars.ui.hudfrag.showToast("[purple]👻 ПРОСТРАНСТВЕННЫЙ РАЗРЫВ!");
            var sx = p.x + Mathf.range(80);
            var sy = p.y + Mathf.range(80);
            Fx.portal.at(sx, sy);
            Sounds.witch.at(sx, sy);
            UnitTypes.scepter.spawn(Team.crux, sx, sy);
        } else if (type === 3) {
            Vars.ui.hudfrag.showToast("[yellow]⚡ ЭЛЕКТРОМАГНИТНЫЙ ИМПУЛЬС!");
            Fx.shockwave.at(p.x, p.y);
            Sounds.spark.at(p.x, p.y);
        }
    }
});
