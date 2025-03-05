import type { App } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

export default (app: App) => {
  const vuetify = createVuetify();
  app.use(vuetify);
};
