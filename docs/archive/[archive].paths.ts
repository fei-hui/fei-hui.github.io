import { TECHNOLOGIES } from '../../constants';

export default {
  paths() {
    return Object.values(TECHNOLOGIES).map(technology => ({
      params: { archive: technology.toLowerCase() },
    }));
  },
};
