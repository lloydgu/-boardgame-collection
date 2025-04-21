const { createApp } = Vue;

createApp({
    data() {
        return {
            // 新增排序状态
            sortOrder: 'asc', // 可选值：'asc'（升序）或 'desc'（降序）
            games: [],
            searchText: '',
            selectedTags: new Set(),
            categoryMap: {
                weight: '<img src="image/卡比兽.png" class="category-icon" alt="重度"> 重度',
                theme: '<img src="image/皮卡丘.png" class="category-icon" alt="主题"> 主题',
                mechanic: '<img src="image/小磁怪.png" class="category-icon" alt="机制"> 机制',
                other: '<img src="image/百变怪.png" class="category-icon" alt="其他"> 其他'
            },
            selectedCategoryTags: {
                weight: new Set(),
                theme: new Set(),
                mechanic: new Set(),
                other: new Set() 
            },
            categoryStates: {
                weight: false,
                theme: false,
                mechanic: false,
                other: false
            },
            searchText: '',
            showSearch: false,
            isLoading: true,
            error: null,
            playerCount: null,
            filtersApplied: false

        }
    },
    computed: {

          // 排序后的游戏列表（覆盖原有filteredGames）
          sortedGames() {
            return [...this.filteredGames].sort((a, b) => {
              // 按难度数值排序（假设难度是数字类型）
              const diffA = parseInt(a.难度);
              const diffB = parseInt(b.难度);
              return this.sortOrder === 'asc' ? diffA - diffB : diffB - diffA;
            });
          },
        
        // 组合过滤逻辑
        filteredGames() {
            if (!this.hasAppliedFilters) return [];
            return this.games.filter(game => {
                // 文本搜索匹配（名称或自由标签）
                const textMatch = this.searchText === '' || 
                    game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    game.标签.some(tag => 
                        !this.isCategoryTag(tag) &&
                        tag.toLowerCase().includes(this.searchText.toLowerCase())
                    );

            // 新增人数过滤
                const playerMatch = !this.playerCount || 
                    this.checkPlayerCount(game.人数, this.playerCount);

                // 自由标签匹配
                const freeTagMatch = this.filtersApplied ? 
                (this.selectedTags.size === 0 || 
                Array.from(this.selectedTags).some(tag => 
                    game.标签.includes(tag)
                )) : true;

                // 分类标签匹配（AND逻辑）
                const categoryMatch = this.filtersApplied ? 
                Object.entries(this.selectedCategoryTags).every(([category, tags]) => 
                    tags.size === 0 || 
                    game.标签.some(gameTag => {
                        const [cat, val] = this.splitTag(gameTag);
                        return cat === category && tags.has(val);
                    })
                ) : true;
                return textMatch && freeTagMatch && categoryMatch && playerMatch;
            });

            
        },
        potentialGameCount() {
            return this.games.filter(game => {
                // 复用过滤逻辑但忽略filtersApplied状态
                const textMatch = this.searchText === '' || 
                    game.名称.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    game.标签.some(tag => 
                        !this.isCategoryTag(tag) &&
                        tag.toLowerCase().includes(this.searchText.toLowerCase())
                    );
    
                const playerMatch = !this.playerCount || 
                    this.checkPlayerCount(game.人数, this.playerCount);
    
                const freeTagMatch = this.selectedTags.size === 0 || 
                    Array.from(this.selectedTags).some(tag => 
                        game.标签.includes(tag)
                    );
    
                const categoryMatch = Object.entries(this.selectedCategoryTags)
                    .every(([category, tags]) => 
                        tags.size === 0 || 
                        game.标签.some(gameTag => {
                            const [cat, val] = this.splitTag(gameTag);
                            return cat === category && tags.has(val);
                        })
                    );
    
                return textMatch && freeTagMatch && categoryMatch && playerMatch;
            }).length;
        },
        // 当前激活筛选数量
        activeFilterCount() {
            return Array.from(this.selectedTags).length + 
                Object.values(this.selectedCategoryTags)
                    .reduce((acc, set) => acc + set.size, 0);
        }
    },
    methods: {
        toggleSortOrder() {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
          },
        // 新增应用筛选方法
        applyFilters() {
            this.hasAppliedFilters = true;
            this.filtersApplied = true;
        },
            toggleSearch() {
            this.showSearch = !this.showSearch
            
        },

        toggleCategory(category) {
            this.categoryStates[category] = !this.categoryStates[category];
        },
        // 添加人数验证方法
        checkPlayerCount(range, target) {
            // 提取所有数字（处理含中文的情况）
            const numbers = (range.match(/\d+/g) || []).map(Number);
            if (numbers.length === 0) return false;
            
            const min = Math.min(...numbers);
            const max = Math.max(...numbers);
            return target >= min && target <= max;
        },
        // 标签解析方法
        splitTag(tag) {
            const parts = tag.split(':');
            if (parts.length === 1) return ['custom', parts[0].trim()];
            return [parts[0].trim().toLowerCase(), parts[1].trim()];
        },

        // 分类标签操作
        toggleCategoryTag(category, tag) {
            const selected = this.selectedCategoryTags[category];
            selected.has(tag) ? selected.delete(tag) : selected.add(tag);
            this.filtersApplied = false;
            this.hasAppliedFilters = false;
        },

        // 自由标签操作
        toggleTag(tag) {
            this.selectedTags.has(tag) ? 
                this.selectedTags.delete(tag) : 
                this.selectedTags.add(tag);
                this.filtersApplied = false;
                this.hasAppliedFilters = false;
        },

        // 分类标签点击处理
        toggleParsedTag(tag) {
            const [category, value] = this.splitTag(tag);
            if (this.categoryMap[category]) {
                this.toggleCategoryTag(category, value);
            }
        },

        // 获取分类标签
        getCategoryTags(category) {
            const tagCounts = {};
            
            // 统计标签出现次数
            this.games.forEach(game => {
                game.标签.forEach(tag => {
                    const [cat, val] = this.splitTag(tag);
                    if (cat === category) {
                        tagCounts[val] = (tagCounts[val] || 0) + 1;
                    }
                });
            });
        
            // 转换为数组并排序
            return Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1]) // 按次数降序
                .map(item => item[0]);       // 只返回标签名称
        },
        // 标签统计
        getTagCount(category, targetTag) {
            return this.games.reduce((count, game) => {
                return count + game.标签.filter(tag => {
                    const [cat, val] = this.splitTag(tag);
                    return cat === category && val === targetTag;
                }).length;
            }, 0);
        },

        // 标签类型判断
        isCategoryTag(tag) {
            return tag.includes(':');
        },

        getTagCategory(tag) {
            return this.splitTag(tag)[0];
        },

        getTagName(tag) {
            return this.splitTag(tag)[1];
        },

        // 游戏可见性判断
        isGameVisible(game) {
            return Object.entries(this.selectedCategoryTags).every(([cat, tags]) => {
                if (tags.size === 0) return true;
                return game.标签.some(tag => {
                    const [category, value] = this.splitTag(tag);
                    return category === cat && tags.has(value);
                });
            });
        },

        // 数据加载
        async loadData() {
            try {
                const response = await fetch('https://script.google.com/macros/s/AKfycbwRJiknJtO9j7stCeuOoQTyYjalDwRZHLCCSt8sdJB9dZvYbm6gU1HPaDj7ncjWIcuK/exec');
                // 'https://sheetdb.io/api/v1/anwk6x0uukfcf'
                if (!response.ok) throw new Error('数据加载失败');
                
                const rawData = await response.json();
                this.games = rawData.map(item => ({
                    ...item,
                    标签: item.标签.split(',').map(t => t.trim()),
                    
                }));

                // 本地缓存
                localStorage.setItem('gamesCache', JSON.stringify(this.games));
            } catch (error) {
                console.error('数据加载失败:', error);
                this.error = '数据加载失败，正在使用缓存...';
                const cache = localStorage.getItem('gamesCache');
                if (cache) this.games = JSON.parse(cache);
            } finally {
                this.isLoading = false;
            }
        }
    },
    mounted() {
        
        this.loadData();
    }
}).mount('#app');

