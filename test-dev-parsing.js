const { PyProjectParser } = require('./out/parsers/pyProjectParser');
const { VersionChecker } = require('./out/versionChecker');

async function testDevVersionParsing() {
    console.log('=== Тестирование парсинга dev-версий ===\n');
    
    const parser = new PyProjectParser();
    const versionChecker = new VersionChecker();
    
    // Сохраняем оригинальный файл
    const fs = require('fs');
    const originalContent = fs.readFileSync('pyproject.toml', 'utf8');
    
    try {
        // Заменяем на тестовый файл
        fs.copyFileSync('test-dev-versions.toml', 'pyproject.toml');
        
        // Тестируем парсинг зависимостей
        const dependencies = parser.parseDependencies('.');
        
        console.log('Найденные зависимости с различными форматами версий:');
        dependencies.forEach(dep => {
            console.log(`- ${dep.name}: ${dep.requestedVersion}`);
        });
        
        console.log('\n=== Тестирование сравнения версий ===\n');
        
        // Тестируем различные форматы версий
        const testCases = [
            { current: '25.1', latest: '25.1' },
            { current: '25.1', latest: '25.2' },
            { current: '18.0.1.dev0', latest: '18.0.1.dev0' },
            { current: '18.0.1.dev0', latest: '18.0.1' },
            { current: '1.2.3a1', latest: '1.2.3a1' },
            { current: '1.2.3a1', latest: '1.2.3' },
            { current: '2.0.0b2', latest: '2.0.0b2' },
            { current: '3.1.0rc1', latest: '3.1.0' }
        ];
        
        for (const testCase of testCases) {
            const result = await versionChecker.getLatestVersion('test-package', testCase.current);
            if (result) {
                // Симулируем latest версию для теста
                result.latestVersion = testCase.latest;
                result.isUpToDate = testCase.current === testCase.latest;
                result.isOutdated = !result.isUpToDate;
                
                const status = result.isUpToDate ? '✅ Up-to-date' : '🔴 Outdated';
                console.log(`${testCase.current} vs ${testCase.latest}: ${status}`);
            }
        }
        
    } finally {
        // Восстанавливаем оригинальный файл
        fs.writeFileSync('pyproject.toml', originalContent);
    }
    
    console.log('\n=== Тест завершен ===');
}

testDevVersionParsing().catch(console.error); 