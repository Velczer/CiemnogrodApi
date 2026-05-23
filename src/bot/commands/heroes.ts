import { SlashCommandBuilder } from 'discord.js';

export const heroesCommand = new SlashCommandBuilder()
  .setName('heroes')
  .setDescription('Zapisz wynik meczu')
  .addUserOption((o) =>
    o.setName('player1').setDescription('Gracz 1').setRequired(true)
  )
  .addUserOption((o) =>
    o.setName('player2').setDescription('Gracz 2').setRequired(true)
  )
  .addStringOption((o) =>
    o.setName('score').setDescription('Wynik np 2:1').setRequired(true)
  )
  .addStringOption((o) =>
    o.setName('map').setDescription('Mapa np. Exodus').setRequired(true)
  );
