import { SlashCommandBuilder } from 'discord.js';
import { factions } from '../helpers/factions.js';

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

    Object.entries(factions).forEach(([value, name]) => {
      opt.addChoices({
        name,
        value,
      });
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

    Object.entries(factions).forEach(([value, name]) => {
      opt.addChoices({
        name,
        value,
      });
    });

    return opt;
  })

  .addStringOption((opt) =>
    opt.setName('score').setDescription('Wynik np 2:1').setRequired(true)
  )

  .addStringOption((opt) =>
    opt.setName('map').setDescription('Mapa np. Exodus').setRequired(true)
  );
