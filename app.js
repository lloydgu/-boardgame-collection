const { createApp } = Vue;

createApp({
    data() {
        return {
            // 原有数据...
            
            // 新增分类系统
            categories: {
                '重度': ['轻策', '中策', '重策'],
                '主题': ['自然', '历史', '科幻', '奇幻'],
                '机制': ['行动规划', '引擎构筑', '成套收集', '区域控制']
            },
            selectedCategories: {
                '重度': null,
                '主题': null,
                '机制': null
            }
        }
    },
    computed: {
        filteredGames() {
            return this.games.filter(game => {
                // 原有过滤条件...
                
                // 新增分类过滤
                const categoryMatch = Object.entries(this.selectedCategories)
                    .every(([category, selected]) => 
                        !selected || game[category]?.includes(selected)
                    );
                
                return textMatch && tagMatch && categoryMatch;
            });
        }
    },
    methods: {
        // 分类筛选方法
        setCategoryFilter(category, tag) {
            this.selectedCategories[category] = 
                this.selectedCategories[category] === tag ? null : tag;
        },
        
        // 标签样式生成
        getCategoryClass(category) {
            return {
                'active': this.selectedCategories[category] === tag,
                [category.toLowerCase()]: true
            }
        },
        
        // 修改后的数据加载
        async loadData() {
            const response = await fetch('https://sheetdb.io/api/v1/anwk6x0uukfcf');
            this.games = (await response.json()).map(item => ({
                ...item,
                // 将分类字段转为数组
                重度: item.重度?.split(','),
                主题: item.主题?.split(','),
                机制: item.机制?.split(',')
            }));
        }
    }
}).mount('#app');