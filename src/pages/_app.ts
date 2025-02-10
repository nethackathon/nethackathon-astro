import type { App } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

export default (app: App) => {
  const vuetify = createVuetify();
  console.log('got here');
  app.use(vuetify);
};
