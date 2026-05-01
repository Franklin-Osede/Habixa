import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a recipe by id with hydrated ingredient quantities',
    description:
      'Returns the recipe metadata (title, instructions, macros, image, ' +
      'prep time, dietary flags) plus its ingredient list with grams + unit. ' +
      '404 when the recipe does not exist.',
  })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: { include: { ingredient: true } },
      },
    });

    if (!recipe) throw new NotFoundException('Recipe not found');

    return {
      id: recipe.id,
      title: recipe.title,
      instructions: recipe.instructions,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fats: recipe.fats,
      imageUrl: recipe.imageUrl,
      prepTimeMin: recipe.prepTimeMin,
      isVegan: recipe.isVegan,
      isGlutenFree: recipe.isGlutenFree,
      ingredients: recipe.ingredients.map((ri) => ({
        quantityGrams: ri.quantityGrams,
        unit: ri.unit,
        notes: ri.notes,
        ingredient: {
          id: ri.ingredient.id,
          name: ri.ingredient.name,
          category: ri.ingredient.category,
          caloriesPer100g: ri.ingredient.caloriesPer100g,
          isVegan: ri.ingredient.isVegan,
        },
      })),
    };
  }
}
