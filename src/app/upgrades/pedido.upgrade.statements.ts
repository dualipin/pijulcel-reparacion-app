export class PedidoUpgradeStatements {
  pedidoUpgrades = [
    {
      toVersion: 1,
      statements: [
        `
        CREATE TABLE pedidos (
            bar_code TEXT PRIMARY KEY NOT NULL CHECK(length(bar_code) <= 10), --MAX 10 caracteres
            name_cli TEXT NOT NULL CHECK(length(name_cli) <= 50), --MAX 50 caracteres
            tel_cli TEXT NOT NULL CHECK(length(tel_cli) <= 20), --MAX 20 caracteres
            device_name TEXT NOT NULL CHECK(length(device_name) <= 60), --MAX 60 caracteres
            prob_texto TEXT CHECK(length(prob_texto) <= 510), --MAX 510 caracteres
            prob_audio TEXT CHECK(length(prob_audio) <= 100), --MAX 100 caracteres
            img_1 TEXT NOT NULL CHECK(length(img_1) <= 100), --MAX 100 caracteres
            img_2 TEXT CHECK(length(img_2) <= 100), --MAX 100 caracteres
            estatus TEXT DEFAULT 'pendiente', --pendiente, en proceso, listo, entregado
            created DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación
            updated DATETIME DEFAULT CURRENT_TIMESTAMP -- Fecha de última actualización
        );

        `
      ]
    },
    /* add new statements below for next database version when required*/
    /*
    {
      toVersion: 2,
      statements: [
        `ALTER TABLE users ADD COLUMN email TEXT;`,
      ]
    }
    */
  ]
}
