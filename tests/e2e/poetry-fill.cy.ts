/// <reference types="cypress" />

describe('诗词填空生成器 E2E 测试', () => {
  const samplePoetry = `登临送目，正故国晚秋
千里澄江似练，翠峰如簇
归帆去棹残阳里，背西风，酒旗斜矗
彩舟云淡，星河�起飞，起舞
念往昔繁华竞逐，叹门外楼头，悲恨相续`;

  beforeEach(() => {
    cy.visit('/');
    // Wait for app to be fully loaded
    cy.get('[data-testid="app-header"]').should('be.visible');
  });

  describe('1. 页面加载和初始化', () => {
    it('应该正确加载页面并显示标题', () => {
      cy.get('[data-testid="app-header"]').within(() => {
        cy.get('h1').should('contain', '诗词填空生成器');
      });
    });

    it('应该显示所有必要的输入区域', () => {
      cy.get('[data-testid="poetry-input-section"]').should('be.visible');
      cy.get('[data-testid="difficulty-selector"]').should('be.visible');
    });

    it('应该正确设置语言和可访问性属性', () => {
      cy.get('html').should('have.attr', 'lang', 'zh-CN');
    });
  });

  describe('2. 诗词输入功能', () => {
    it('应该能够输入诗词标题', () => {
      cy.get('[data-testid="poetry-title-input"]')
        .clear()
        .type('桂枝香·金陵怀古')
        .should('have.value', '桂枝香·金陵怀古');
    });

    it('应该能够输入诗词作者', () => {
      cy.get('[data-testid="poetry-author-input"]')
        .clear()
        .type('王安石')
        .should('have.value', '王安石');
    });

    it('应该能够输入诗词内容', () => {
      cy.get('[data-testid="poetry-content-input"]')
        .clear()
        .type(samplePoetry)
        .should('not.be.empty');
    });

    it('输入诗词内容后应该显示交互式填空区域', () => {
      cy.get('[data-testid="poetry-content-input"]').type(samplePoetry);
      cy.get('[data-testid="interactive-blanks"]').should('be.visible');
    });

    it('应该支持自动识别标题和作者', () => {
      const poetryWithMeta = `桂枝香·金陵怀古（王安石）
登临送目，正故国晚秋
千里澄江似练`;

      cy.get('[data-testid="poetry-content-input"]').type(poetryWithMeta);
      // Wait for auto-detection
      cy.wait(500);
      cy.get('[data-testid="poetry-title-input"]').should('have.value', '桂枝香·金陵怀古');
      cy.get('[data-testid="poetry-author-input"]').should('have.value', '王安石');
    });
  });

  describe('3. 难度选择功能', () => {
    it('默认应该选中中等难度', () => {
      cy.get('[data-testid="difficulty-medium"]')
        .should('be.checked');
    });

    it('应该能够切换到简单难度', () => {
      cy.selectDifficulty('easy');
      cy.get('[data-testid="difficulty-easy"]').should('be.checked');
    });

    it('应该能够切换到困难难度', () => {
      cy.selectDifficulty('hard');
      cy.get('[data-testid="difficulty-hard"]').should('be.checked');
    });

    it('难度切换应该触发填空重新生成', () => {
      cy.get('[data-testid="poetry-content-input"]').type('明月几时有，把酒问青天');
      cy.wait(500);

      cy.selectDifficulty('easy');
      cy.wait(300);

      cy.selectDifficulty('hard');
      cy.wait(300);

      cy.get('[data-testid="interactive-blanks"]').should('be.visible');
    });
  });

  describe('4. 智能生成功能', () => {
    it('未输入内容时生成按钮应该禁用', () => {
      cy.get('[data-testid="generate-button"]')
        .should('be.disabled');
    });

    it('输入内容后生成按钮应该可用', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光，疑是地上霜');
      cy.get('[data-testid="generate-button"]')
        .should('not.be.disabled');
    });

    it('应该能够成功生成填空题', () => {
      cy.get('[data-testid="poetry-content-input"]').type(samplePoetry);
      cy.selectDifficulty('medium');

      cy.get('[data-testid="generate-button"]').click();

      cy.waitForGeneration();
      cy.verifyQuestionsGenerated();

      // Verify preview shows generated content
      cy.get('[data-testid="question-preview"]')
        .should('contain', '____');
    });

    it('不同难度应该生成不同数量的填空', () => {
      const testPoetry = '明月几时有，把酒问青天，不知天上宫阙，今夕是何年';

      cy.get('[data-testid="poetry-content-input"]').type(testPoetry);

      // Easy mode
      cy.selectDifficulty('easy');
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      let easyBlankCount: number;
      cy.get('[data-testid="question-preview"]')
        .invoke('text')
        .then((text) => {
          easyBlankCount = (text.match(/____/g) || []).length;
        });

      // Hard mode
      cy.get('[data-testid="generate-button"]').click();
      cy.selectDifficulty('hard');
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.get('[data-testid="question-preview"]')
        .invoke('text')
        .then((text) => {
          const hardBlankCount = (text.match(/____/g) || []).length;
          // Hard mode should have more blanks than easy mode
          expect(hardBlankCount).to.be.greaterThan(easyBlankCount || 0);
        });
    });
  });

  describe('5. 交互式手动填空', () => {
    it('应该显示交互式填空界面', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光，疑是地上霜');
      cy.get('[data-testid="interactive-blanks"]').should('be.visible');
    });

    it('应该能够切换到手动选择模式', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光');
      cy.get('[data-testid="mode-manual-btn"]').click();
      cy.get('[data-testid="manual-controls"]').should('be.visible');
    });

    it('应该能够点击选择字符作为填空', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光');
      cy.get('[data-testid="mode-manual-btn"]').click();

      // Click on a selectable character
      cy.get('.char-selectable')
        .first()
        .click();

      // The character should now show as blank
      cy.get('.char-selectable.selected')
        .should('exist');
    });

    it('应该能够选择推荐填空', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光，疑是地上霜');
      cy.get('[data-testid="mode-manual-btn"]').click();

      cy.get('[data-testid="select-recommended-btn"]').click();

      // Should have selected characters
      cy.get('.char-selectable.selected')
        .should('have.length.greaterThan', 0);
    });

    it('应该能够清除所有选择', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光');
      cy.get('[data-testid="mode-manual-btn"]').click();

      cy.get('[data-testid="select-recommended-btn"]').click();
      cy.get('[data-testid="clear-all-btn"]').click();

      // All selections should be cleared
      cy.get('.char-selectable.selected')
        .should('have.length', 0);
    });

    it('应该能够使用手动选择生成题目', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光，疑是地上霜');
      cy.get('[data-testid="mode-manual-btn"]').click();
      cy.get('[data-testid="select-recommended-btn"]').click();

      cy.get('[data-testid="generate-blanks-btn"]').click();

      cy.verifyQuestionsGenerated();
    });
  });

  describe('6. 预览功能', () => {
    it('初始状态应该显示空预览提示', () => {
      cy.get('[data-testid="question-preview"]').within(() => {
        cy.get('[data-testid="empty-preview-message"]')
          .should('contain', '请输入诗词内容');
      });
    });

    it('生成后应该显示题目预览', () => {
      cy.get('[data-testid="poetry-content-input"]').type(samplePoetry);
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.get('[data-testid="question-preview"]')
        .should('not.contain', '请输入诗词内容');
    });

    it('应该显示原文对照', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光');
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.get('[data-testid="question-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="original-text"]')
            .should('contain', '原文');
        });
    });

    it('应该显示统计信息', () => {
      cy.get('[data-testid="poetry-content-input"]').type(samplePoetry);
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.get('[data-testid="preview-stats"]')
        .should('contain', '共生成')
        .and('contain', '道填空题');
    });
  });

  describe('7. 导出功能', () => {
    it('未生成题目时导出按钮应该隐藏', () => {
      cy.get('[data-testid="copy-text-button"]').should('not.exist');
      cy.get('[data-testid="export-docx-button"]').should('not.exist');
    });

    it('生成题目后应该显示导出按钮', () => {
      cy.get('[data-testid="poetry-content-input"]').type(samplePoetry);
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.get('[data-testid="copy-text-button"]').should('be.visible');
      cy.get('[data-testid="export-docx-button"]').should('be.visible');
    });

    it('应该能够复制文本到剪贴板', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光，疑是地上霜');
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      // Mock clipboard API
      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, 'writeText').resolves();
      });

      cy.get('[data-testid="copy-text-button"]').click();

      cy.get('[data-testid="toast-message"]')
        .should('contain', '已复制');
    });

    it('导出Docx应该触发下载', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光，疑是地上霜');
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      // Set up download listener
      cy.get('[data-testid="export-docx-button"]').should('not.be.disabled');
    });
  });

  describe('8. 键盘导航', () => {
    it('应该能够使用Tab键导航到各个输入框', () => {
      // Press Tab to move focus
      cy.get('body').tab();

      cy.focused().should('have.attr', 'data-testid', 'poetry-title-input');
    });

    it('难度选择应该支持键盘操作', () => {
      cy.get('[data-testid="difficulty-easy"]').focus();
      cy.get('[data-testid="difficulty-easy"]')
        .should('have.attr', 'role', 'radio');

      cy.focused().type('{enter}');
      cy.get('[data-testid="difficulty-easy"]').should('be.checked');
    });
  });

  describe('9. 响应式设计', () => {
    it('大屏幕应该显示两栏布局', () => {
      cy.viewport(1280, 720);

      cy.get('[data-testid="app-main"]').within(() => {
        cy.get('.input-section').should('be.visible');
        cy.get('.preview-section').should('be.visible');
      });
    });

    it('小屏幕应该显示单栏布局', () => {
      cy.viewport(375, 667);

      cy.get('[data-testid="app-main"]').within(() => {
        // Both sections should still be visible but stacked
        cy.get('.input-section').should('be.visible');
        cy.get('.preview-section').should('be.visible');
      });
    });
  });

  describe('10. 错误处理', () => {
    it('空内容提交应该显示错误提示', () => {
      cy.get('[data-testid="generate-button"]').click();

      cy.on('window:alert', (alertText) => {
        expect(alertText).to.contain('请输入诗词内容');
      });
    });

    it('应该正确处理特殊字符输入', () => {
      const specialPoetry = '明月·清风，山水，「诗词」';

      cy.get('[data-testid="poetry-content-input"]').type(specialPoetry);
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      // Should handle special characters without crashing
      cy.get('[data-testid="question-preview"]').should('be.visible');
    });

    it('长文本应该能够正常处理', () => {
      const longPoetry = Array(20).fill('床前明月光，疑是地上霜，举头望明月，低头思故乡').join('\n');

      cy.get('[data-testid="poetry-content-input"]').type(longPoetry);
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.verifyQuestionsGenerated(20);
    });
  });

  describe('11. 可访问性', () => {
    it('所有表单元素应该有关联的label', () => {
      cy.get('[data-testid="poetry-title-input"]')
        .should('have.attr', 'id')
        .and('not.be.empty');

      cy.get('label')
        .should('have.length.greaterThan', 0);
    });

    it('按钮应该有可访问的名称', () => {
      cy.get('[data-testid="generate-button"]')
        .should('have.attr', 'aria-label')
        .or('have.text');
    });

    it('动态内容应该有aria-live属性', () => {
      cy.get('[data-testid="poetry-content-input"]').type('床前明月光');
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      cy.get('[data-testid="question-preview"]')
        .should('have.attr', 'aria-live');
    });
  });

  describe('12. 性能测试', () => {
    it('页面加载应该在合理时间内完成', () => {
      const start = Date.now();

      cy.visit('/');
      cy.get('[data-testid="app-header"]').should('be.visible');

      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(5000);
    });

    it('生成操作应该在合理时间内完成', () => {
      cy.get('[data-testid="poetry-content-input"]').type(samplePoetry);

      const start = Date.now();
      cy.get('[data-testid="generate-button"]').click();
      cy.waitForGeneration();

      const generateTime = Date.now() - start;
      expect(generateTime).to.be.lessThan(3000);
    });
  });
});
