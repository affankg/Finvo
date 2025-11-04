const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

/**
 * DocumentNumberSettings Model
 * 
 * Purpose: Store configuration for auto-generating document numbers
 * Scope: Invoice, Quotation, Project numbering
 * Safety: Non-destructive - does not affect existing numbering
 */
const DocumentNumberSettings = sequelize.define('DocumentNumberSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('invoice', 'quotation', 'project'),
    allowNull: false,
    unique: true,
    validate: {
      isIn: {
        args: [['invoice', 'quotation', 'project']],
        msg: 'Type must be one of: invoice, quotation, project'
      }
    }
  },
  prefix: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '',
    validate: {
      is: {
        args: /^[A-Z0-9-]*$/i,
        msg: 'Prefix can only contain letters, numbers, and hyphens'
      },
      len: {
        args: [0, 50],
        msg: 'Prefix must be 50 characters or less'
      }
    }
  },
  current_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: 0,
        msg: 'Current number cannot be negative'
      }
    }
  },
  padding_length: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: {
      min: 1,
      max: 8,
      msg: 'Padding length must be between 1 and 8'
    }
  },
  include_year: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  include_month: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  reset_rule: {
    type: DataTypes.ENUM('never', 'monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'never',
    validate: {
      isIn: {
        args: [['never', 'monthly', 'yearly']],
        msg: 'Reset rule must be one of: never, monthly, yearly'
      }
    }
  },
  last_reset_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'document_number_settings',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

/**
 * DocumentNumberHistory Model
 * 
 * Purpose: Track all assigned document numbers for audit trail
 */
const DocumentNumberHistory = sequelize.define('DocumentNumberHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('invoice', 'quotation', 'project'),
    allowNull: false
  },
  document_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  generated_number: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sequence_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date_token: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'document_number_history',
  timestamps: false,
  underscored: true
});

// Indexes
DocumentNumberHistory.addHook('afterSync', async () => {
  // Ensure unique constraint on generated_number
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_generated_number 
    ON document_number_history(generated_number)
  `);
});

module.exports = {
  DocumentNumberSettings,
  DocumentNumberHistory
};
