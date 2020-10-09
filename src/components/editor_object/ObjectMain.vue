<template>
    <div class="objMain">
        <CategoryWrapper title="Drawing &amp; Animation" iconPath="assets/placeholder">
            <CatDrawing />
        </CategoryWrapper>
        <CategoryWrapper title="Physics" iconPath="assets/placeholder">
            <CatPhysics />
        </CategoryWrapper>
        <CategoryWrapper title="Logic" iconPath="assets/placeholder">
            <CatLogic />
        </CategoryWrapper>
    </div>
</template>

<script>
import CategoryWrapper from './CategoryWrapper';
import CatDrawing from './CatDrawing';
import CatPhysics from './CatPhsyics';
import CatLogic from './CatLogic';

export default {
    name: 'ObjectEditor',
    components: {
        CategoryWrapper,
        CatDrawing,
        CatPhysics,
        CatLogic
    },
    methods: {
        updateAssetSelection() {
            return null;
        }
    }
}
</script>

<style scoped>
.objMain{
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: white;
    padding: 20px;
    width: 100%;
    overflow-x: auto;
}
</style>