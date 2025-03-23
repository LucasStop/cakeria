const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Recipe extends Model {
    static associate(models) {
      // Associações com outros modelos
      Recipe.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
      Recipe.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Recipe.hasMany(models.Comment, { foreignKey: 'recipeId', as: 'comments' });
      Recipe.belongsToMany(models.User, { 
        through: 'RecipeFavorites',
        as: 'favoritedBy',
        foreignKey: 'recipeId' 
      });
    }
  }

  Recipe.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    prepTime: {
      type: DataTypes.INTEGER,
      comment: 'Tempo de preparo em minutos'
    },
    cookTime: {
      type: DataTypes.INTEGER,
      comment: 'Tempo de cozimento em minutos'
    },
    servings: {
      type: DataTypes.INTEGER
    },
    difficulty: {
      type: DataTypes.ENUM('Fácil', 'Médio', 'Difícil'),
      defaultValue: 'Médio'
    },
    imageUrl: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('rascunho', 'publicado'),
      defaultValue: 'publicado'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Recipe',
    tableName: 'recipes',
    timestamps: true
  });

  // Hook para gerar slug antes de salvar
  Recipe.beforeCreate(async (recipe) => {
    let slug = recipe.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    let slugExists = true;
    let counter = 0;
    let newSlug = slug;
    
    while (slugExists) {
      const existingRecipe = await Recipe.findOne({ where: { slug: newSlug } });
      if (!existingRecipe) {
        slugExists = false;
      } else {
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }
    
    recipe.slug = newSlug;
  });

  return Recipe;
};
