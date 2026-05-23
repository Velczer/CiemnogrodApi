import { SlashCommandBuilder } from 'discord.js';

const factions = [
  { name: 'Świątynia', value: 'Temple' },
  { name: 'Nekropolis', value: 'Necropolis' },
  { name: 'Knieja', value: 'Sylvan' },
  { name: 'Rój', value: 'Hive' },
  { name: 'Schisma', value: 'Schisma' },
  { name: 'Loch', value: 'Dungeon' },
];

export const heroesCommand = new SlashCommandBuilder()
  .setName('heroes')
  .setDescription('Zapis wyniku meczu')

  .addUserOption((opt) =>
    opt.setName('player1').setDescription('Gracz 1').setRequired(true)
  )

  .addStringOption((opt) => {
    opt
      .setName('faction1')
      .setDescription('Frakcja gracza 1')
      .setRequired(true);

    factions.forEach((faction) => {
      opt.addChoices(faction);
    });

    return opt;
  })

  .addUserOption((opt) =>
    opt.setName('player2').setDescription('Gracz 2').setRequired(true)
  )

  .addStringOption((opt) => {
    opt
      .setName('faction2')
      .setDescription('Frakcja gracza 2')
      .setRequired(true);

    factions.forEach((faction) => {
      opt.addChoices(faction);
    });

    return opt;
  })

  .addStringOption((opt) =>
    opt.setName('score').setDescription('Wynik np 2:1').setRequired(true)
  )

  .addStringOption((opt) =>
    opt.setName('map').setDescription('Mapa np. Exodus').setRequired(true)
  );
