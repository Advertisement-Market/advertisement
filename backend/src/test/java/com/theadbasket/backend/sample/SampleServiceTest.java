package com.theadbasket.backend.sample;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Pure unit test for {@link SampleService} using Mockito (no Spring context). */
@ExtendWith(MockitoExtension.class)
class SampleServiceTest {

    @Mock
    private SampleItemRepository repository;

    @InjectMocks
    private SampleService service;

    @Test
    void findAll_returnsItemsFromRepository() {
        when(repository.findAll()).thenReturn(List.of(new SampleItem("One"), new SampleItem("Two")));

        List<SampleItem> result = service.findAll();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(SampleItem::getName).containsExactly("One", "Two");
        verify(repository).findAll();
    }
}
