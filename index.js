const ansi = require("ansi");
const R = require("ramda");

const NB_SIMULATIONS = 1000;
const TABLE_LIMIT = 99999999999999999; //20000;

const average = R.converge(R.divide, [R.sum, R.length]);
// const writeCurrentLine = cur => d => {
//   console.log("=> cursor", cur);
//   return writeNextLine
//     ? cur.write(d).write(`\n`)
//     : cur
//         .horizontalAbsolute(0)
//         .eraseLine()
//         .write(d);
// };
// const write = writeCurrentLine(ansi(process.srdout));

const isBlack = () => Math.random() < 0.4864864865;

const rebet = state =>
  Math.min(state.bet * 2, state.money, TABLE_LIMIT, betLimit(state));
const betLimit = state => state.money;
const stopPlaying = state =>
  state.money <= 0 || state.money > state.baseMoney + state.baseBet * 1000;

const martingale = state => {
  state.money -= state.bet;
  if (state.money <= 0) return state;
  state.try++;
  if (isBlack()) {
    return {
      ...state,
      money: (state.money += state.bet * 2)
    };
  }
  return martingale({
    ...state,
    bet: state.strategies.rebet(state)
  });
};

const game = s => {
  let state = { ...s, money: s.baseMoney, games: 0 };
  while (!state.strategies.stopPlaying(state)) {
    state = martingale({ ...state, try: 0, bet: s.baseBet });
    state.games++;
    state.maxTrys = Math.max(state.try, state.maxTrys || 0);(state.try >= 5 ? 0 : state.money);
    state.maxBet = Math.max(state.bet, state.maxBet || 0);
  }
  return state;
};

const simulation = (nb, state) => {
  const simus = [...Array(nb).keys()].map(n => {
    if (n % 100 === 0) console.log(`${n} simulations...`);
    return game(R.clone(state));
  });
  const successSimu = simus.filter(s => s.money);
  const failedSimu = simus.filter(s => !s.money);
  const gamesSuccess = successSimu.map(s => s.games);
  const gamesFails = failedSimu.map(s => s.games);
  return {
    ...R.pick(["baseMoney", "baseBet"], state),
    nb_simulations: nb,
    success: {
      nb: `${successSimu.length} (${(100 * successSimu.length) / nb}%)`,
      games: {
        min: Math.min(...gamesSuccess),
        max: Math.max(...gamesSuccess),
        moy: Math.round((average(gamesSuccess) * 100) / 100)
      }
    },
    fails: {
      nb: `${failedSimu.length} (${(100 * failedSimu.length) / nb}%)`,
      games: {
        min: Math.min(...gamesFails),
        max: Math.max(...gamesFails),
        moy: Math.round((average(gamesFails) * 100) / 100)
      },
      maxBet: Math.max(...failedSimu.map(s => s.maxBet))
    }
  };
};

const state = {
  baseMoney: 10000000,
  baseBet: 10,
  strategies: {
    stopPlaying,
    rebet
  }
};

const afterState = simulation(NB_SIMULATIONS, state);

console.log(JSON.stringify(afterState, null, 2));
